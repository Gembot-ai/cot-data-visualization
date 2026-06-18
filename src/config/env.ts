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

  // JWT — signs the app's own session token (issued after eccuity OAuth login).
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-local-only',

  // CORS
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

  // --- eccuity OAuth (login) ---
  // The CoT app is an OAuth client of eccuity (authorization_code + PKCE).
  // Login is only enabled once ECCUITY_CLIENT_ID is set (see config/auth.ts
  // `authEnabled`); until then the app behaves exactly as before (no gating).
  ECCUITY_OAUTH_ISSUER: process.env.ECCUITY_OAUTH_ISSUER || 'https://api.eccuity.com',
  ECCUITY_CLIENT_ID: process.env.ECCUITY_CLIENT_ID || '',
  // Optional — only set if eccuity issues a confidential client. Default is a
  // public client secured by PKCE alone (matches the agents/13F apps).
  ECCUITY_CLIENT_SECRET: process.env.ECCUITY_CLIENT_SECRET || '',
  // Public origin used to build the OAuth redirect_uri. Must match what's
  // allowlisted in eccuity. Prod: https://cot.eccuity.com.
  PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL || (isProduction
    ? 'https://cot.eccuity.com'
    : 'http://localhost:3000'),
  // Signs the short-lived OAuth state/PKCE cookies (@fastify/cookie).
  COOKIE_SECRET: process.env.COOKIE_SECRET || process.env.JWT_SECRET || 'dev-cookie-secret-local-only',
  // Anonymous users see only the most recent N weeks of history/prices.
  AUTH_RECENT_WINDOW_WEEKS: parseInt(process.env.AUTH_RECENT_WINDOW_WEEKS || '52', 10),

  // CFTC API
  CFTC_API_BASE: process.env.CFTC_API_BASE || 'https://publicreporting.cftc.gov/api/',

  // Job Scheduler — automatic CoT data refresh (cron expression, UTC).
  // Defaults to DAILY at 21:00 UTC (CFTC publishes Fri ~20:30 UTC; running
  // daily catches the new report the next time it fires even if the service
  // was redeploying at release time). Override with DATA_FETCH_CRON.
  // NOTE: the legacy WEEKLY_FETCH_CRON var is intentionally NOT used — it held
  // a weekly schedule, which is exactly what we're moving away from.
  DATA_FETCH_CRON: process.env.DATA_FETCH_CRON || '0 21 * * *',

  // Run the in-app scheduler. Enabled in production by default; in development
  // set ENABLE_SCHEDULER=true to opt in (avoids hitting CFTC during local dev).
  ENABLE_SCHEDULER: process.env.ENABLE_SCHEDULER
    ? process.env.ENABLE_SCHEDULER === 'true'
    : isProduction,

  // App Password Protection (optional - leave empty to disable)
  APP_PASSWORD: process.env.APP_PASSWORD || '',

  // Admin API key for data management endpoints
  ADMIN_KEY: process.env.ADMIN_KEY || '',
};
