import { loadConfig } from './config';

describe('loadConfig', () => {
  const databaseUrl =
    'postgresql://user:password@ep-example.neon.tech/cinex_dev?sslmode=require';

  it('requires a valid PostgreSQL URL and gives safe defaults', () => {
    expect(() => loadConfig({})).toThrow('DATABASE_URL is required');
    expect(loadConfig({ DATABASE_URL: databaseUrl })).toEqual({
      databaseUrl,
      port: 3000,
      reservationHoldMinutes: 5,
      paymentReconciliationTimeoutMinutes: 30,
    });
  });

  it('rejects unsafe URL schemes and invalid numeric settings', () => {
    expect(() => loadConfig({ DATABASE_URL: 'https://example.com' })).toThrow(
      'postgres://',
    );
    expect(() => loadConfig({ DATABASE_URL: databaseUrl, PORT: '0' })).toThrow(
      'PORT must be a positive integer',
    );
  });
});
