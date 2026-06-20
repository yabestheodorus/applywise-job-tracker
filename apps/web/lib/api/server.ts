import { createClient } from '@/lib/supabase/server';

// Normalize: a scheme-less host (e.g. "api.up.railway.app") isn't a valid
// fetch URL, so default to https; also drop any trailing slash.
function normalizeBaseUrl(raw: string): string {
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withScheme.replace(/\/+$/, '');
}

const API_URL = normalizeBaseUrl(process.env.API_URL ?? 'http://localhost:3001');

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Server-side fetch to the NestJS API, forwarding the current user's Supabase
 * access token as a Bearer JWT (the API's SupabaseAuthGuard verifies it).
 * Use only from Server Components, Server Actions, or Route Handlers.
 */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Let the browser/runtime set the multipart boundary for FormData uploads.
  const isFormData = init?.body instanceof FormData;

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...init?.headers,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null);
    const message =
      body && typeof body === 'object' && 'message' in body
        ? String((body as { message: unknown }).message)
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  // 204 No Content guard.
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
