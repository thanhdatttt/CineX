import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { sign } from 'jsonwebtoken';
import { UserRole } from '../generated/prisma/enums';
import { PrismaService } from '../database/prisma.service';
import { UsersService } from '../users/users.service';
import { AuthSettings } from './auth.settings';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

const settings: AuthSettings = {
  jwtSecret: 'test-secret-with-more-than-thirty-two-random-bytes',
  jwtAccessTokenTtlSeconds: 900,
  jwtRefreshTokenTtlDays: 30,
};

function contextFor(request: Record<string, any>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as unknown as ExecutionContext;
}

describe('request authorization', () => {
  const prisma = { user: { findUnique: jest.fn() } };
  const reflector = { getAllAndOverride: jest.fn() };
  const jwtGuard = new JwtAuthGuard(
    prisma as unknown as PrismaService,
    settings,
  );
  const rolesGuard = new RolesGuard(reflector as unknown as Reflector);

  beforeEach(() => jest.clearAllMocks());

  it('rejects missing, malformed, and expired bearer tokens with 401', async () => {
    const expiredToken = sign({ sub: 'user-1' }, settings.jwtSecret, {
      expiresIn: -1,
      issuer: 'cinex-api',
      audience: 'cinex-client',
    });
    for (const authorization of [
      undefined,
      'Bearer malformed',
      `Bearer ${expiredToken}`,
    ]) {
      await expect(
        jwtGuard.canActivate(contextFor({ headers: { authorization } })),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    }
  });

  it('loads the current role from the database on every valid request', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'alice@example.com',
      role: UserRole.STAFF,
      status: 'ACTIVE',
    });
    const token = sign({ role: UserRole.ADMIN }, settings.jwtSecret, {
      subject: 'user-1',
      issuer: 'cinex-api',
      audience: 'cinex-client',
      expiresIn: 600,
    });
    const request = { headers: { authorization: `Bearer ${token}` } };

    await expect(jwtGuard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(request).toHaveProperty('user.role', UserRole.STAFF);
  });

  it('returns 403 when the authenticated role is not allowed', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    expect(() =>
      rolesGuard.canActivate(contextFor({ user: { role: UserRole.CUSTOMER } })),
    ).toThrow(ForbiddenException);
  });

  it('limits customers to their own profile', async () => {
    const service = new UsersService({} as PrismaService);
    await expect(
      service.getProfile(
        { id: 'customer-1', email: 'c@example.com', role: UserRole.CUSTOMER },
        'customer-2',
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});
