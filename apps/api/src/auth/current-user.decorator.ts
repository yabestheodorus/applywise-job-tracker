import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

import type { AuthUser } from './auth-user';

/**
 * Injects the authenticated user attached by `SupabaseAuthGuard`.
 * `@CurrentUser()` → the whole `AuthUser`; `@CurrentUser('id')` → a single field.
 */
export const CurrentUser = createParamDecorator(
  (field: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException();
    }
    return field ? user[field] : user;
  },
);
