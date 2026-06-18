import crypto from 'crypto';
import { env } from './env';

/**
 * Auth/session configuration for the eccuity OAuth login + anonymous gating.
 * The app is an OAuth client of eccuity (authorization_code + PKCE); after a
 * one-time code exchange it issues its OWN session JWT in an httpOnly cookie.
 */

// Cookie names
export const SESSION_COOKIE = 'cot_session';
export const STATE_COOKIE = 'cot_oauth_state';
export const VERIFIER_COOKIE = 'cot_oauth_verifier';

// Session lifetime
export const SESSION_TTL = '30d';
export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 30; // 30 days
export const OAUTH_TX_MAX_AGE_S = 60 * 10;          // state/verifier cookies: 10 min

/**
 * Login is only active once an eccuity client id is configured. Until then the
 * app serves everyone full data exactly as before (safe rollout) — deploying
 * this code changes nothing until ECCUITY_CLIENT_ID (+ secrets) are set.
 */
export const authEnabled = Boolean(env.ECCUITY_CLIENT_ID);

/** Anonymous users only see history/prices on or after this date. */
export function recentWindowStart(): Date {
  const d = new Date();
  d.setDate(d.getDate() - env.AUTH_RECENT_WINDOW_WEEKS * 7);
  return d;
}

/** The OAuth redirect_uri — must be allowlisted in eccuity. */
export function redirectUri(): string {
  return `${env.PUBLIC_BASE_URL.replace(/\/$/, '')}/api/v1/auth/callback`;
}

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** PKCE: high-entropy code verifier. */
export function generateVerifier(): string {
  return base64url(crypto.randomBytes(32));
}

/** PKCE S256 code challenge derived from a verifier. */
export function challengeFromVerifier(verifier: string): string {
  return base64url(crypto.createHash('sha256').update(verifier).digest());
}

/** Opaque CSRF state value. */
export function generateState(): string {
  return base64url(crypto.randomBytes(16));
}

/**
 * eccuity feature flag that grants CoT admin access. eccuity admins carry this
 * flag on their user (FeatureFlagNames.ADMIN); they get the admin panel + full
 * access without needing the separate ADMIN_KEY.
 */
export const ECCUITY_ADMIN_FLAG = 'ADMIN';

export function isAdminUser(featureFlags?: string[] | null): boolean {
  return Array.isArray(featureFlags) && featureFlags.includes(ECCUITY_ADMIN_FLAG);
}

/** Our session JWT payload / request identity shape. */
export interface SessionUser {
  sub: string;
  email?: string;
  name?: string;
  isAdmin?: boolean;
}
