import { env } from '../config/env';
import { redirectUri } from '../config/auth';
import { logger } from '../utils/logger';

/**
 * Minimal HTTP client for eccuity's OAuth2 server (authorization_code + PKCE).
 * We only need it to (1) build the authorize URL, (2) exchange the code, and
 * (3) read the user's identity once. The eccuity access token is never stored.
 */

const issuer = () => env.ECCUITY_OAUTH_ISSUER.replace(/\/$/, '');

export interface EccuityUser {
  id: string;
  email?: string;
  name?: string;
  featureFlags?: string[];
}

export function buildAuthorizeUrl(params: { state: string; codeChallenge: string }): string {
  const url = new URL(`${issuer()}/oauth/authorize`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', env.ECCUITY_CLIENT_ID);
  url.searchParams.set('redirect_uri', redirectUri());
  url.searchParams.set('state', params.state);
  url.searchParams.set('code_challenge', params.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('scope', '');
  return url.toString();
}

export async function exchangeCode(params: { code: string; codeVerifier: string }): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: params.code,
    redirect_uri: redirectUri(),
    client_id: env.ECCUITY_CLIENT_ID,
    code_verifier: params.codeVerifier,
  });
  // Confidential clients only — public clients (default) are secured by PKCE.
  if (env.ECCUITY_CLIENT_SECRET) body.set('client_secret', env.ECCUITY_CLIENT_SECRET);

  const res = await fetch(`${issuer()}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    logger.error({ status: res.status, body: text.slice(0, 300) }, 'eccuity token exchange failed');
    throw new Error(`token exchange failed: ${res.status}`);
  }

  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error('token exchange: missing access_token');
  return json.access_token;
}

export async function fetchCurrentUser(accessToken: string): Promise<EccuityUser> {
  const res = await fetch(`${issuer()}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query: '{ fetchCurrentUser { id email name featureFlags } }' }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    logger.error({ status: res.status, body: text.slice(0, 300) }, 'eccuity fetchCurrentUser failed');
    throw new Error(`fetchCurrentUser failed: ${res.status}`);
  }

  const json = (await res.json()) as {
    data?: { fetchCurrentUser?: EccuityUser };
    errors?: unknown;
  };
  const user = json.data?.fetchCurrentUser;
  if (!user?.id) {
    logger.error({ errors: json.errors }, 'eccuity fetchCurrentUser returned no user');
    throw new Error('fetchCurrentUser: no user');
  }
  return user;
}
