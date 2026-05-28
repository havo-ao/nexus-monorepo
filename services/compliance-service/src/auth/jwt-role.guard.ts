import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { AUTH_ROLES_KEY, AuthRole } from './roles.decorator';

type JwtPayload = {
  exp?: number;
  type?: string;
  role?: string;
};

@Injectable()
export class JwtRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<AuthRole[]>(AUTH_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) {
      return true;
    }

    const payload = this.verifyToken(
      this.extractBearerToken(context.switchToHttp().getRequest<Request>()),
    );
    if (payload.type !== 'access') {
      throw new UnauthorizedException('access token is required');
    }

    const role = String(payload.role ?? '').toUpperCase() as AuthRole;
    if (!roles.includes(role)) {
      throw new ForbiddenException('insufficient role for this operation');
    }

    return true;
  }

  private extractBearerToken(request: Request): string {
    const authorization = request.header('authorization') ?? '';
    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('bearer token is required');
    }
    return token;
  }

  private verifyToken(token: string): JwtPayload {
    const secret = process.env.NEXUS_JWT_SECRET;
    if (!secret) {
      throw new UnauthorizedException('jwt secret is not configured');
    }
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    if (!encodedHeader || !encodedPayload || !signature) {
      throw new UnauthorizedException('invalid token');
    }
    const expectedSignature = createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');
    if (!this.safeEquals(signature, expectedSignature)) {
      throw new UnauthorizedException('invalid token signature');
    }
    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8'),
    ) as JwtPayload;
    if (!payload.exp || payload.exp * 1000 <= Date.now()) {
      throw new UnauthorizedException('token has expired');
    }
    return payload;
  }

  private safeEquals(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    return (
      leftBuffer.length === rightBuffer.length &&
      timingSafeEqual(leftBuffer, rightBuffer)
    );
  }
}
