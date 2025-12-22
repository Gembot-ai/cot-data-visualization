import dotenv from 'dotenv';

dotenv.config();

export const env = {
  // Server
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://cot_user:dev_password@localhost:5432/cot_db',

  // Redis
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',

  // CORS
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // CFTC API
  CFTC_API_BASE: process.env.CFTC_API_BASE || 'https://publicreporting.cftc.gov/api/',

  // Job Scheduler
  WEEKLY_FETCH_CRON: process.env.WEEKLY_FETCH_CRON || '0 20 * * FRI',
};
