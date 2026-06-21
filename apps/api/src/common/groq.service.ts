import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z, type ZodType } from 'zod';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const MAX_ATTEMPTS = 3;

interface GroqChatResponse {
  choices?: { message?: { content?: string } }[];
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Thin wrapper over Groq's OpenAI-compatible chat completions endpoint. Asks the
 * model for JSON, retries on rate-limit/5xx with backoff, and validates the
 * response against a Zod schema before returning. Shared (in `CommonModule`).
 */
@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name);

  constructor(private readonly config: ConfigService) { }

  async extractJson<S extends ZodType>(opts: {
    system: string;
    user: string;
    schema: S;
  }): Promise<z.infer<S>> {
    const apiKey = this.config.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'AI extraction is not configured (missing GROQ_API_KEY).',
      );
    }
    const model = this.config.get<string>('GROQ_MODEL') ?? DEFAULT_MODEL;

    const content = await this.complete(
      apiKey,
      model,
      [
        { role: 'system', content: opts.system },
        { role: 'user', content: opts.user },
      ],
      true,
    );

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      this.logger.error('Groq returned non-JSON content');
      throw new UnprocessableEntityException(
        'AI returned an unreadable response. Please try again.',
      );
    }

    const result = opts.schema.safeParse(parsed);
    if (!result.success) {
      this.logger.error(`Groq JSON failed schema validation: ${result.error.message}`);
      throw new UnprocessableEntityException(
        'AI response did not match the expected format. Please try again.',
      );
    }
    return result.data;
  }


  /**
   * Free-form chat that returns the model's plain-text reply (no JSON mode).
   * Used by the live mock interview, where the client holds the running
   * transcript and we just want the interviewer's next turn.
   */
  async chatText(opts: {
    messages: ChatMessage[];
    temperature?: number;
  }): Promise<string> {
    const apiKey = this.config.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'AI is not configured (missing GROQ_API_KEY).',
      );
    }
    const model = this.config.get<string>('GROQ_MODEL') ?? DEFAULT_MODEL;
    return this.complete(apiKey, model, opts.messages, false, opts.temperature);
  }

  private async complete(
    apiKey: string,
    model: string,
    messages: ChatMessage[],
    jsonMode: boolean,
    temperature = 0.1,
  ): Promise<string> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature,
          ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
          messages,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as GroqChatResponse;
        const content = data.choices?.[0]?.message?.content;
        if (typeof content !== 'string' || content.length === 0) {
          throw new UnprocessableEntityException('AI returned an empty response.');
        }
        return content;
      }

      // Retry on rate-limit / transient server errors; fail fast otherwise.
      if (res.status === 429 || res.status >= 500) {
        lastError = new Error(`Groq responded ${res.status}`);
        await this.backoff(attempt);
        continue;
      }

      const body = await res.text();
      this.logger.error(`Groq error ${res.status}: ${body}`);
      throw new ServiceUnavailableException('AI service error. Please try again.');
    }

    this.logger.error(`Groq failed after ${MAX_ATTEMPTS} attempts: ${String(lastError)}`);
    throw new ServiceUnavailableException(
      'AI service is busy (rate limited). Please try again shortly.',
    );
  }

  private backoff(attempt: number): Promise<void> {
    const ms = 300 * 2 ** (attempt - 1); // 300ms, 600ms, 1200ms
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
