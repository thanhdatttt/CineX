import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { sign } from 'jsonwebtoken';
import { PrismaService } from '../database/prisma.service';
import { UserRole } from '../generated/prisma/enums';
import { LoginDto, RegisterDto } from './auth.dto';
import { AuthenticatedUser } from './auth.types';
import { hashPassword, verifyPassword } from './password';
import { AUTH_SETTINGS } from './auth.settings';
import type { AuthSettings } from './auth.settings';
import { RefreshTokenDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUTH_SETTINGS) private readonly settings: AuthSettings,
  ) {}

  async register(input: RegisterDto) {
    const email = input.email.trim();
    const normalizedEmail = email.toLowerCase();
    const passwordHash = await hashPassword(input.password);

    let user: AuthenticatedUser;
    try {
      user = await this.prisma.user.create({
        data: { email, normalizedEmail, passwordHash, role: UserRole.CUSTOMER },
        select: { id: true, email: true, role: true },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException(
          'An account with this email already exists.',
        );
      }
      throw error;
    }

    return this.createSession(user);
  }

  async login(input: LoginDto) {
    const normalizedEmail = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { normalizedEmail },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        passwordHash: true,
      },
    });

    if (!user) {
      await hashPassword(input.password);
      throw new UnauthorizedException('Invalid email or password.');
    }
    const validPassword = await verifyPassword(
      input.password,
      user.passwordHash,
    );
    if (!validPassword || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.createSession({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async refresh(input: RefreshTokenDto) {
    const presentedHash = hashRefreshToken(input.refreshToken);
    const result = await this.prisma.$transaction(async (tx) => {
      const token = await tx.refreshToken.findUnique({
        where: { tokenHash: presentedHash },
        include: {
          user: {
            select: { id: true, email: true, role: true, status: true },
          },
        },
      });
      if (!token) return { kind: 'invalid' as const };

      const now = new Date();
      const rotation = await tx.refreshToken.updateMany({
        where: {
          id: token.id,
          revokedAt: null,
          expiresAt: { gt: now },
        },
        data: { revokedAt: now },
      });
      if (rotation.count !== 1 || token.user.status !== 'ACTIVE') {
        await tx.refreshToken.updateMany({
          where: { familyId: token.familyId, revokedAt: null },
          data: { revokedAt: now },
        });
        return { kind: 'invalid' as const };
      }

      const nextRefreshToken = randomBytes(32).toString('base64url');
      await tx.refreshToken.create({
        data: {
          userId: token.userId,
          familyId: token.familyId,
          tokenHash: hashRefreshToken(nextRefreshToken),
          expiresAt: refreshExpiry(this.settings.jwtRefreshTokenTtlDays, now),
        },
      });
      return {
        kind: 'rotated' as const,
        user: {
          id: token.user.id,
          email: token.user.email,
          role: token.user.role,
        },
        refreshToken: nextRefreshToken,
      };
    });

    if (result.kind !== 'rotated') {
      throw new UnauthorizedException('Invalid refresh token.');
    }
    return this.tokenPair(result.user, result.refreshToken);
  }

  async logout(input: RefreshTokenDto): Promise<{ success: true }> {
    const tokenHash = hashRefreshToken(input.refreshToken);
    await this.prisma.$transaction(async (tx) => {
      const token = await tx.refreshToken.findUnique({
        where: { tokenHash },
        select: { familyId: true },
      });
      if (!token) return;
      await tx.refreshToken.updateMany({
        where: { familyId: token.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });
    return { success: true };
  }

  private async createSession(user: AuthenticatedUser) {
    const refreshToken = randomBytes(32).toString('base64url');
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        familyId: randomUUID(),
        tokenHash: hashRefreshToken(refreshToken),
        expiresAt: refreshExpiry(this.settings.jwtRefreshTokenTtlDays),
      },
    });
    return this.tokenPair(user, refreshToken);
  }

  private tokenPair(user: AuthenticatedUser, refreshToken: string) {
    const accessToken = sign({}, this.settings.jwtSecret, {
      algorithm: 'HS256',
      subject: user.id,
      issuer: 'cinex-api',
      audience: 'cinex-client',
      expiresIn: this.settings.jwtAccessTokenTtlSeconds,
    });
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      accessTokenExpiresIn: this.settings.jwtAccessTokenTtlSeconds,
      refreshTokenExpiresIn:
        this.settings.jwtRefreshTokenTtlDays * 24 * 60 * 60,
      user,
    };
  }
}

function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function refreshExpiry(days: number, from = new Date()): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}
