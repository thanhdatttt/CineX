import { loadConfig } from './config';

describe('loadConfig', () => {
  const databaseUrl =
    'postgresql://user:password@ep-example.neon.tech/cinex_dev?sslmode=require';
  const jwtSecret = 'this-is-a-test-secret-with-at-least-32-bytes';

  it('requires a valid PostgreSQL URL and gives safe defaults', () => {
    expect(() => loadConfig({})).toThrow('DATABASE_URL is required');
    expect(
      loadConfig({ DATABASE_URL: databaseUrl, JWT_SECRET: jwtSecret }),
    ).toEqual({
      databaseUrl,
      port: 3000,
      reservationHoldMinutes: 5,
      paymentReconciliationTimeoutMinutes: 30,
      jwtSecret,
      jwtAccessTokenTtlSeconds: 600,
      jwtRefreshTokenTtlDays: 7,
    });
  });

  it('rejects unsafe URL schemes and invalid numeric settings', () => {
    expect(() =>
      loadConfig({
        DATABASE_URL: 'https://example.com',
        JWT_SECRET: jwtSecret,
      }),
    ).toThrow('postgres://');
    expect(() =>
      loadConfig({
        DATABASE_URL: databaseUrl,
        JWT_SECRET: jwtSecret,
        PORT: '0',
      }),
    ).toThrow('PORT must be a positive integer');
  });

  it('requires a strong JWT secret and bounds access token lifetime', () => {
    expect(() => loadConfig({ DATABASE_URL: databaseUrl })).toThrow(
      'JWT_SECRET',
    );
    expect(() =>
      loadConfig({
        DATABASE_URL: databaseUrl,
        JWT_SECRET: 'replace-with-a-real-random-secret-of-32-bytes',
      }),
    ).toThrow('JWT_SECRET');
    expect(() =>
      loadConfig({
        DATABASE_URL: databaseUrl,
        JWT_SECRET: jwtSecret,
        JWT_ACCESS_TOKEN_TTL_SECONDS: '86401',
      }),
    ).toThrow('must not exceed 86400');
    expect(() =>
      loadConfig({
        DATABASE_URL: databaseUrl,
        JWT_SECRET: jwtSecret,
        JWT_REFRESH_TOKEN_TTL_DAYS: '91',
      }),
    ).toThrow('must not exceed 90');
  });
});
