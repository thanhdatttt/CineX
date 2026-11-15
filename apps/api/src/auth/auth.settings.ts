export const AUTH_SETTINGS = Symbol('AUTH_SETTINGS');

export interface AuthSettings {
  jwtSecret: string;
  jwtAccessTokenTtlSeconds: number;
  jwtRefreshTokenTtlDays: number;
}
