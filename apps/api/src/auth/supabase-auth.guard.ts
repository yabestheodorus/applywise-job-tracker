import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';

import type { AuthUser } from './auth-user';
import { IS_PUBLIC_ROUTE_KEY } from './public.decorator';

interface SupabaseJwtPayload {
  sub?: string;
  email?: string;
}

/**
 * Global guard: verifies the Supabase Auth JWT from the `Authorization: Bearer`
 * header against the project's public JWKS (`SUPABASE_JWKS_URL`, asymmetric
 * ES256/RS256 signing keys) and attaches `req.user`. The key set is fetched
 * once and cached by `jose`, which refreshes it automatically on an unknown
 * `kid`. Routes opt out with `@Public()`. Missing/invalid token → 401.
 */
@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(SupabaseAuthGuard.name);
  private readonly jwks: JWTVerifyGetKey;

  constructor(
    private readonly reflector: Reflector,
    config: ConfigService,
  ) {
    const jwksUrl = config.getOrThrow<string>('SUPABASE_JWKS_URL');
    this.jwks = createRemoteJWKSet(new URL(jwksUrl));
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublicRoute = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_ROUTE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublicRoute) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearerToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    let payload: SupabaseJwtPayload;
    try {
      ({ payload } = await jwtVerify<SupabaseJwtPayload>(token, this.jwks, {
        algorithms: ['ES256', 'RS256'],
      }));
    } catch (error) {
      this.logger.debug(`JWT verification failed: ${(error as Error).message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (!payload.sub) {
      throw new UnauthorizedException('Token is missing the subject claim');
    }

    const user: AuthUser = { id: payload.sub, email: payload.email };
    request.user = user;
    return true;
  }

  private extractBearerToken(request: Request): string | undefined {
    const header = request.headers.authorization;
    if (!header) {
      return undefined;
    }
    const [scheme, token] = header.split(' ');
    return scheme?.toLowerCase() === 'bearer' && token ? token : undefined;
  }
}
