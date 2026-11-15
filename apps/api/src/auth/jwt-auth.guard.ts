import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verify } from 'jsonwebtoken';
import type { Request } from 'express';
import { PrismaService } from '../database/prisma.service';
import { AUTH_SETTINGS } from './auth.settings';
import type { AuthSettings } from './auth.settings';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUTH_SETTINGS) private readonly settings: AuthSettings,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;
    if (!authorization || authorization.length > 8192) {
      throw new UnauthorizedException('Authentication required.');
    }

    const match =
      /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i.exec(
        authorization,
      );
    if (!match) throw new UnauthorizedException('Authentication required.');

    let subject: string;
    try {
      const claims = verify(match[1], this.settings.jwtSecret, {
        algorithms: ['HS256'],
        issuer: 'cinex-api',
        audience: 'cinex-client',
        maxAge: this.settings.jwtAccessTokenTtlSeconds,
      });
      if (typeof claims === 'string' || typeof claims.sub !== 'string') {
        throw new Error('Invalid subject');
      }
      subject = claims.sub;
    } catch {
      throw new UnauthorizedException('Authentication required.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: subject },
      select: { id: true, email: true, role: true, status: true },
    });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Authentication required.');
    }

    request.user = { id: user.id, email: user.email, role: user.role };
    return true;
  }
}
