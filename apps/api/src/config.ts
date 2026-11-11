export interface AppConfig {
  databaseUrl: string;
  port: number;
  reservationHoldMinutes: number;
  paymentReconciliationTimeoutMinutes: number;
}

function positiveInteger(
  name: string,
  value: string | undefined,
  fallback: number,
): number {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return parsed;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const databaseUrl = env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is required. Set it to an isolated Neon PostgreSQL database.',
    );
  }

  let parsedDatabaseUrl: URL;
  try {
    parsedDatabaseUrl = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL.');
  }
  if (
    parsedDatabaseUrl.protocol !== 'postgres:' &&
    parsedDatabaseUrl.protocol !== 'postgresql:'
  ) {
    throw new Error(
      'DATABASE_URL must use the postgres:// or postgresql:// scheme.',
    );
  }

  return {
    databaseUrl,
    port: positiveInteger('PORT', env.PORT, 3000),
    reservationHoldMinutes: positiveInteger(
      'RESERVATION_HOLD_MINUTES',
      env.RESERVATION_HOLD_MINUTES,
      5,
    ),
    paymentReconciliationTimeoutMinutes: positiveInteger(
      'PAYMENT_RECONCILIATION_TIMEOUT_MINUTES',
      env.PAYMENT_RECONCILIATION_TIMEOUT_MINUTES,
      30,
    ),
  };
}
