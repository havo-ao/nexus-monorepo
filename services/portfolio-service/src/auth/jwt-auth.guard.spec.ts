import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac } from 'crypto';
import { JwtAuthGuard } from './jwt-auth.guard';

const secret = 'local-test-jwt-secret-with-at-least-32-bytes';

type TestTokenPayload = {
  exp?: number;
  type?: string;
  role?: string;
  userId?: string | number;
  id?: string | number;
};

describe('JwtAuthGuard', () => {
  const previousSecret = process.env.NEXUS_JWT_SECRET;
  let guard: JwtAuthGuard;

  beforeEach(() => {
    process.env.NEXUS_JWT_SECRET = secret;
    guard = new JwtAuthGuard();
  });

  afterAll(() => {
    process.env.NEXUS_JWT_SECRET = previousSecret;
  });

  it('allows a trader to access their own trader-scoped route', () => {
    const context = createContext({
      token: createToken({ role: 'TRADER', userId: '101' }),
      params: { traderId: '101' },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows a trader when the traderId comes from the request body', () => {
    const context = createContext({
      token: createToken({ role: 'TRADER', id: 101 }),
      body: { traderId: 101 },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('allows an admin to access any trader route', () => {
    const context = createContext({
      token: createToken({ role: 'ADMIN' }),
      params: { traderId: '202' },
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects requests without a bearer token', () => {
    const context = createContext({ authorization: '' });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('rejects malformed tokens', () => {
    const context = createContext({ token: 'not-a-jwt' });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('rejects tokens when the JWT secret is not configured', () => {
    delete process.env.NEXUS_JWT_SECRET;
    const context = createContext({
      token: createToken({ role: 'TRADER', userId: '101' }),
      params: { traderId: '101' },
    });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('rejects tokens with an invalid signature', () => {
    const token = createToken({ role: 'TRADER', userId: '101' }, 'bad-secret');
    const context = createContext({ token, params: { traderId: '101' } });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('rejects expired tokens', () => {
    const context = createContext({
      token: createToken({
        role: 'TRADER',
        userId: '101',
        exp: pastUnixTime(),
      }),
      params: { traderId: '101' },
    });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('rejects refresh tokens', () => {
    const context = createContext({
      token: createToken({ role: 'TRADER', userId: '101', type: 'refresh' }),
      params: { traderId: '101' },
    });

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('rejects unsupported roles', () => {
    const context = createContext({
      token: createToken({ role: 'CONSULTANT', userId: '101' }),
      params: { traderId: '101' },
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('rejects trader tokens without a user id', () => {
    const context = createContext({
      token: createToken({ role: 'TRADER' }),
      params: { traderId: '101' },
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('rejects a trader accessing another trader id', () => {
    const context = createContext({
      token: createToken({ role: 'TRADER', userId: '101' }),
      params: { traderId: '202' },
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});

function createContext({
  authorization,
  token,
  params = {},
  body,
}: {
  authorization?: string;
  token?: string;
  params?: Record<string, unknown>;
  body?: { traderId?: unknown };
}): ExecutionContext {
  const request = {
    body,
    params,
    header: (name: string) => {
      if (name.toLowerCase() !== 'authorization') {
        return undefined;
      }

      return authorization ?? (token ? `Bearer ${token}` : undefined);
    },
  };

  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

function createToken(
  payload: TestTokenPayload,
  signingSecret = secret,
): string {
  const header = Buffer.from(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
  ).toString('base64url');
  const encodedPayload = Buffer.from(
    JSON.stringify({
      exp: futureUnixTime(),
      role: 'TRADER',
      type: 'access',
      ...payload,
    }),
  ).toString('base64url');
  const signature = createHmac('sha256', signingSecret)
    .update(`${header}.${encodedPayload}`)
    .digest('base64url');

  return `${header}.${encodedPayload}.${signature}`;
}

function futureUnixTime(): number {
  return Math.floor(Date.now() / 1000) + 3600;
}

function pastUnixTime(): number {
  return Math.floor(Date.now() / 1000) - 3600;
}
