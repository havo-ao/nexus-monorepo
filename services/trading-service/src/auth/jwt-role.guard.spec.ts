import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createHmac } from 'node:crypto';
import { JwtRoleGuard } from './jwt-role.guard';
import { AUTH_ROLES_KEY, AuthRole, Roles } from './roles.decorator';

function signToken(
  payload: Record<string, unknown>,
  secret = 'test-secret',
): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

function createContext(
  authorization = '',
  body: Record<string, unknown> = {},
): ExecutionContext {
  const request = {
    body,
    header: jest.fn((name: string) =>
      name.toLowerCase() === 'authorization' ? authorization : undefined,
    ),
  };

  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn(() => ({
      getRequest: jest.fn(() => request),
    })),
  } as unknown as ExecutionContext;
}

describe('JwtRoleGuard', () => {
  const previousSecret = process.env.NEXUS_JWT_SECRET;

  afterEach(() => {
    if (previousSecret === undefined) {
      delete process.env.NEXUS_JWT_SECRET;
    } else {
      process.env.NEXUS_JWT_SECRET = previousSecret;
    }
  });

  it('allows public routes without role metadata', () => {
    const reflector = {
      getAllAndOverride: jest.fn(() => undefined),
    } as unknown as Reflector;
    const guard = new JwtRoleGuard(reflector);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows routes with empty role metadata', () => {
    const reflector = {
      getAllAndOverride: jest.fn(() => []),
    } as unknown as Reflector;
    const guard = new JwtRoleGuard(reflector);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows an admin token for protected routes', () => {
    process.env.NEXUS_JWT_SECRET = 'test-secret';
    const reflector = {
      getAllAndOverride: jest.fn(() => ['ADMIN']),
    } as unknown as Reflector;
    const token = signToken({
      exp: Math.floor(Date.now() / 1000) + 60,
      type: 'access',
      role: 'ADMIN',
    });
    const guard = new JwtRoleGuard(reflector);

    expect(guard.canActivate(createContext(`Bearer ${token}`))).toBe(true);
  });

  it('allows a trader to operate on its own traderId', () => {
    process.env.NEXUS_JWT_SECRET = 'test-secret';
    const reflector = {
      getAllAndOverride: jest.fn(() => ['TRADER']),
    } as unknown as Reflector;
    const token = signToken({
      exp: Math.floor(Date.now() / 1000) + 60,
      type: 'access',
      role: 'TRADER',
      userId: 101,
    });
    const guard = new JwtRoleGuard(reflector);

    expect(
      guard.canActivate(createContext(`Bearer ${token}`, { traderId: 101 })),
    ).toBe(true);
  });

  it('rejects missing bearer tokens for protected routes', () => {
    process.env.NEXUS_JWT_SECRET = 'test-secret';
    const reflector = {
      getAllAndOverride: jest.fn(() => ['ADMIN']),
    } as unknown as Reflector;
    const guard = new JwtRoleGuard(reflector);

    expect(() => guard.canActivate(createContext())).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects non bearer authorization schemes', () => {
    process.env.NEXUS_JWT_SECRET = 'test-secret';
    const reflector = {
      getAllAndOverride: jest.fn(() => ['ADMIN']),
    } as unknown as Reflector;
    const guard = new JwtRoleGuard(reflector);

    expect(() => guard.canActivate(createContext('Basic token'))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects tokens when the JWT secret is not configured', () => {
    delete process.env.NEXUS_JWT_SECRET;
    const reflector = {
      getAllAndOverride: jest.fn(() => ['ADMIN']),
    } as unknown as Reflector;
    const token = signToken({
      exp: Math.floor(Date.now() / 1000) + 60,
      type: 'access',
      role: 'ADMIN',
    });
    const guard = new JwtRoleGuard(reflector);

    expect(() => guard.canActivate(createContext(`Bearer ${token}`))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects malformed, expired, and tampered tokens', () => {
    process.env.NEXUS_JWT_SECRET = 'test-secret';
    const reflector = {
      getAllAndOverride: jest.fn(() => ['ADMIN']),
    } as unknown as Reflector;
    const expiredToken = signToken({
      exp: Math.floor(Date.now() / 1000) - 1,
      type: 'access',
      role: 'ADMIN',
    });
    const tamperedToken = `${expiredToken.slice(0, -1)}x`;
    const guard = new JwtRoleGuard(reflector);

    expect(() => guard.canActivate(createContext('Bearer malformed'))).toThrow(
      UnauthorizedException,
    );
    expect(() =>
      guard.canActivate(createContext(`Bearer ${tamperedToken}`)),
    ).toThrow(UnauthorizedException);
    expect(() =>
      guard.canActivate(createContext(`Bearer ${expiredToken}`)),
    ).toThrow(UnauthorizedException);
  });

  it('rejects refresh tokens and unsupported roles', () => {
    process.env.NEXUS_JWT_SECRET = 'test-secret';
    const reflector = {
      getAllAndOverride: jest.fn(() => ['ADMIN']),
    } as unknown as Reflector;
    const refreshToken = signToken({
      exp: Math.floor(Date.now() / 1000) + 60,
      type: 'refresh',
      role: 'ADMIN',
    });
    const traderToken = signToken({
      exp: Math.floor(Date.now() / 1000) + 60,
      type: 'access',
      role: 'TRADER',
      userId: 101,
    });
    const guard = new JwtRoleGuard(reflector);

    expect(() =>
      guard.canActivate(createContext(`Bearer ${refreshToken}`)),
    ).toThrow(UnauthorizedException);
    expect(() =>
      guard.canActivate(createContext(`Bearer ${traderToken}`)),
    ).toThrow(ForbiddenException);
  });

  it('rejects trader access to a different traderId', () => {
    process.env.NEXUS_JWT_SECRET = 'test-secret';
    const reflector = {
      getAllAndOverride: jest.fn(() => ['TRADER']),
    } as unknown as Reflector;
    const token = signToken({
      exp: Math.floor(Date.now() / 1000) + 60,
      type: 'access',
      role: 'TRADER',
      userId: 101,
    });
    const guard = new JwtRoleGuard(reflector);

    expect(() =>
      guard.canActivate(createContext(`Bearer ${token}`, { traderId: 202 })),
    ).toThrow(ForbiddenException);
  });

  it('rejects trader tokens without a user id', () => {
    process.env.NEXUS_JWT_SECRET = 'test-secret';
    const reflector = {
      getAllAndOverride: jest.fn(() => ['TRADER']),
    } as unknown as Reflector;
    const token = signToken({
      exp: Math.floor(Date.now() / 1000) + 60,
      type: 'access',
      role: 'TRADER',
    });
    const guard = new JwtRoleGuard(reflector);

    expect(() => guard.canActivate(createContext(`Bearer ${token}`))).toThrow(
      ForbiddenException,
    );
  });

  it('sets role metadata through the Roles decorator', () => {
    @Roles('ADMIN')
    class ExampleController {
      run() {
        return true;
      }
    }

    const metadata = new Reflector().get<AuthRole[]>(
      AUTH_ROLES_KEY,
      ExampleController,
    );

    expect(metadata).toEqual(['ADMIN']);
  });
});
