import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Request } from 'express';

type JwtPayload = {
  exp?: number;
  type?: string;
  role?: string;
  userId?: string | number;
  id?: string | number;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractBearerToken(request);
    const payload = this.verifyToken(token);

    if (payload.type !== 'access') {
      throw new UnauthorizedException('access token is required');
    }

    const role = String(payload.role ?? '').toUpperCase();
    if (role === 'ADMIN') {
      return true;
    }

    if (role !== 'TRADER') {
      throw new ForbiddenException('trader access is required');
    }

    const tokenUserId = this.toIdString(payload.userId ?? payload.id);
    const requestedTraderId = this.resolveRequestedTraderId(request);

    if (!tokenUserId) {
      throw new ForbiddenException('token userId is required');
    }

    if (requestedTraderId && requestedTraderId !== tokenUserId) {
      throw new ForbiddenException(
        'traderId does not match authenticated user',
      );
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

    const expectedSignature = this.sign(
      `${encodedHeader}.${encodedPayload}`,
      secret,
    );
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

  private sign(value: string, secret: string): string {
    return createHmac('sha256', secret).update(value).digest('base64url');
  }

  private safeEquals(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    return (
      leftBuffer.length === rightBuffer.length &&
      timingSafeEqual(leftBuffer, rightBuffer)
    );
  }

  private resolveRequestedTraderId(request: Request): string | null {
    const params = request.params as Record<string, unknown>;
    if (params.traderId !== undefined) {
      return this.toIdString(params.traderId);
    }

    const body = request.body as { traderId?: unknown } | undefined;
    if (body?.traderId === undefined) {
      return null;
    }

    return this.toIdString(body.traderId);
  }

  private toIdString(value: unknown): string {
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value).trim();
    }

    return '';
  }
}
