import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { AUTH_SETTINGS, AuthSettings } from './auth.settings';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    RolesGuard,
    {
      provide: AUTH_SETTINGS,
      useFactory: (): AuthSettings => ({
        jwtSecret: process.env.JWT_SECRET!,
        jwtAccessTokenTtlSeconds: Number(
          process.env.JWT_ACCESS_TOKEN_TTL_SECONDS ?? 600,
        ),
        jwtRefreshTokenTtlDays: Number(
          process.env.JWT_REFRESH_TOKEN_TTL_DAYS ?? 7,
        ),
      }),
    },
  ],
  exports: [JwtAuthGuard, RolesGuard, AUTH_SETTINGS],
})
export class AuthModule {}
