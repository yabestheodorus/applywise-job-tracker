import { Injectable, NotFoundException } from '@nestjs/common';

import { GroqService } from '../common/groq.service';
import { PrismaService } from '../common/prisma.service';
import {
  templateExtractionSchema,
  type ApplyTemplatesDto,
  type CreateTemplateDto,
  type UpdateTemplateDto,
} from './dto';
import { TEMPLATE_EXTRACTION_SYSTEM_PROMPT } from './prompts';

@Injectable()
export class TemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groq: GroqService,
  ) {}

  findAllForUser(userId: string) {
    return this.prisma.template.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /** Step 2: Groq mines pasted form text for Q&A pairs, deduped vs existing. */
  async extract(userId: string, rawText: string) {
    const existing = await this.prisma.template.findMany({
      where: { userId },
      select: { id: true, question: true, topic: true },
    });
    const user = JSON.stringify({ rawText, existingTemplates: existing });
    const draft = await this.groq.extractJson({
      system: TEMPLATE_EXTRACTION_SYSTEM_PROMPT,
      user,
      schema: templateExtractionSchema,
    });

    // Drop any matchedId the model invented — only keep real, owned ids.
    const ids = new Set(existing.map((t) => t.id));
    return {
      items: draft.items.map((item) => ({
        matchedId: item.matchedId && ids.has(item.matchedId) ? item.matchedId : null,
        topic: item.topic.trim() || 'Others',
        question: item.question,
        answer: item.answer,
      })),
    };
  }

  /** Step 3: persist reviewed drafts — items with an owned id update, else create. */
  async apply(userId: string, dto: ApplyTemplatesDto) {
    const owned = await this.prisma.template.findMany({
      where: { userId },
      select: { id: true },
    });
    const ownedIds = new Set(owned.map((t) => t.id));

    const ops = dto.items.map((item) =>
      item.id && ownedIds.has(item.id)
        ? this.prisma.template.update({
            where: { id: item.id },
            data: { topic: item.topic, question: item.question, answer: item.answer },
          })
        : this.prisma.template.create({
            data: {
              userId,
              topic: item.topic,
              question: item.question,
              answer: item.answer,
            },
          }),
    );
    await this.prisma.$transaction(ops);
    return this.findAllForUser(userId);
  }

  create(userId: string, dto: CreateTemplateDto) {
    return this.prisma.template.create({
      data: {
        userId,
        topic: dto.topic,
        question: dto.question,
        answer: dto.answer,
      },
    });
  }

  private async assertOwned(userId: string, id: string) {
    const template = await this.prisma.template.findFirst({ where: { id, userId } });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async update(userId: string, id: string, dto: UpdateTemplateDto) {
    await this.assertOwned(userId, id);
    return this.prisma.template.update({ where: { id }, data: dto });
  }

  async remove(userId: string, id: string) {
    await this.assertOwned(userId, id);
    await this.prisma.template.delete({ where: { id } });
    return { id };
  }
}
