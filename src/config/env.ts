import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value && isProduction) {
    throw new Error(`${name} is required in production`);
  }
  return value || '';
}

export const env = {
  // Server
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database - required in production, fallback for local dev only
  DATABASE_URL: process.env.DATABASE_URL || (isProduction
    ? (() => { throw new Error('DATABASE_URL is required in production'); })()
    : 'postgresql://cot_user:dev_password@localhost:5432/cot_db'),

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT - required in production
  JWT_SECRET: process.env.JWT_SECRET || (isProduction
    ? (() => { throw new Error('JWT_SECRET is required in production'); })()
    : 'dev-secret-local-only'),

  // CORS
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // CFTC API
  CFTC_API_BASE: process.env.CFTC_API_BASE || 'https://publicreporting.cftc.gov/api/',

  // Job Scheduler
  WEEKLY_FETCH_CRON: process.env.WEEKLY_FETCH_CRON || '0 20 * * FRI',

  // App Password Protection (optional - leave empty to disable)
  APP_PASSWORD: process.env.APP_PASSWORD || '',

  // Admin API key for data management endpoints
  ADMIN_KEY: requireEnv('ADMIN_KEY'),
};
