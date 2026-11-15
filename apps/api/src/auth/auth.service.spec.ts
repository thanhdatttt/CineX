/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return */
import { UnauthorizedException } from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import { UserRole } from '../generated/prisma/enums';
import { PrismaService } from '../database/prisma.service';
import { AuthService } from './auth.service';
import { AuthSettings } from './auth.settings';
import { hashPassword, verifyPassword } from './password';

describe('AuthService', () => {
  const settings: AuthSettings = {
    jwtSecret: 'test-secret-with-more-than-thirty-two-random-bytes',
    jwtAccessTokenTtlSeconds: 900,
    jwtRefreshTokenTtlDays: 30,
  };
  const prisma = {
    user: { create: jest.fn(), findUnique: jest.fn() },
    refreshToken: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  const service = new AuthService(prisma as unknown as PrismaService, settings);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.refreshToken.create.mockResolvedValue({ id: 'refresh-1' });
  });

  it('normalizes registration email and never returns a password hash', async () => {
    prisma.user.create.mockImplementation(({ data }) =>
      Promise.resolve({
        id: 'user-1',
        email: data.email,
        role: UserRole.CUSTOMER,
      }),
    );
    const result = await service.register({
      email: '  Alice@Example.com ',
      password: 'correct horse battery staple',
    });

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'Alice@Example.com',
          normalizedEmail: 'alice@example.com',
          role: UserRole.CUSTOMER,
        }),
        select: { id: true, email: true, role: true },
      }),
    );
    expect(result.user).toEqual({
      id: 'user-1',
      email: 'Alice@Example.com',
      role: UserRole.CUSTOMER,
    });
    expect(JSON.stringify(result)).not.toContain('passwordHash');
    const claims = verify(result.accessToken, settings.jwtSecret, {
      algorithms: ['HS256'],
      issuer: 'cinex-api',
      audience: 'cinex-client',
    });
    expect(claims).toMatchObject({ sub: 'user-1', exp: expect.any(Number) });
  });

  it('authenticates valid passwords and rejects invalid ones', async () => {
    const passwordHash = await hashPassword('correct horse battery staple');
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'alice@example.com',
      role: UserRole.CUSTOMER,
      status: 'ACTIVE',
      passwordHash,
    });

    const result = await service.login({
      email: ' ALICE@example.com ',
      password: 'correct horse battery staple',
    });
    expect(result.user.id).toBe('user-1');
    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { normalizedEmail: 'alice@example.com' },
      }),
    );
    await expect(verifyPassword('wrong password', passwordHash)).resolves.toBe(
      false,
    );
  });

  it('uses a generic error for unknown accounts', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.login({
        email: 'missing@example.com',
        password: 'some password',
      }),
    ).rejects.toThrow(new UnauthorizedException('Invalid email or password.'));
  });

  it('stores only a hash of a high-entropy refresh token', async () => {
    prisma.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'alice@example.com',
      role: UserRole.CUSTOMER,
    });
    const result = await service.register({
      email: 'alice@example.com',
      password: 'correct horse battery staple',
    });
    expect(result.refreshToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(prisma.refreshToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        tokenHash: expect.not.stringMatching(result.refreshToken),
        familyId: expect.any(String),
        expiresAt: expect.any(Date),
      }),
    });
  });

  it('rotates a refresh token atomically and rejects reuse', async () => {
    const oldToken = 'a'.repeat(43);
    const tokenRecord = {
      id: 'refresh-1',
      userId: 'user-1',
      familyId: 'family-1',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      user: {
        id: 'user-1',
        email: 'alice@example.com',
        role: UserRole.CUSTOMER,
        status: 'ACTIVE',
      },
    };
    const tx = {
      refreshToken: {
        findUnique: jest.fn().mockResolvedValue(tokenRecord),
        updateMany: jest
          .fn()
          .mockResolvedValueOnce({ count: 1 })
          .mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({ id: 'refresh-2' }),
      },
    };
    prisma.$transaction.mockImplementation((callback) => callback(tx));

    const result = await service.refresh({ refreshToken: oldToken });
    expect(result.refreshToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(result.refreshToken).not.toBe(oldToken);
    expect(tx.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'refresh-1', revokedAt: null }),
      }),
    );

    tx.refreshToken.findUnique.mockResolvedValue({
      ...tokenRecord,
      revokedAt: new Date(),
    });
    await expect(service.refresh({ refreshToken: oldToken })).rejects.toThrow(
      'Invalid refresh token.',
    );
    expect(tx.refreshToken.updateMany).toHaveBeenLastCalledWith({
      where: { familyId: 'family-1', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });
});
