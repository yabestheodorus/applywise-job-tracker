/**
 * The authenticated principal attached to the request by `SupabaseAuthGuard`.
 * `id` is the Supabase Auth user UUID (`sub` claim) — the multi-tenant key
 * every query scopes to.
 */
export interface AuthUser {
  id: string;
  email?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
