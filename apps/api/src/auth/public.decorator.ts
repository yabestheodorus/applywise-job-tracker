import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_ROUTE_KEY = 'isPublicRoute';

/**
 * Opt a route (or controller) out of the global `SupabaseAuthGuard`.
 * Use only for genuinely public endpoints, e.g. the health check.
 */
export const Public = () => SetMetadata(IS_PUBLIC_ROUTE_KEY, true);
