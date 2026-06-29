import { FastifyInstance } from 'fastify';
import { env } from '../../config/env';
import {
  authEnabled,
  generateState,
  generateVerifier,
  challengeFromVerifier,
  isAdminUser,
  SESSION_COOKIE,
  STATE_COOKIE,
  VERIFIER_COOKIE,
  SESSION_TTL,
  SESSION_MAX_AGE_S,
  OAUTH_TX_MAX_AGE_S,
} from '../../config/auth';
import { buildAuthorizeUrl, exchangeCode, fetchCurrentUser } from '../../services/eccuity-oauth.service';
import { logger } from '../../utils/logger';

const isProd = env.NODE_ENV === 'production';

// Short-lived signed cookies holding the OAuth state + PKCE verifier.
function txCookieOpts(maxAge: number) {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    signed: true,
    path: '/api/v1/auth',
    maxAge,
  };
}

// TEMPORARY: last login failure, exposed via GET /auth/debug-last for diagnosis.
let lastAuthError: { step: string; message: string; at: string } | null = null;

export async function authRoutes(fastify: FastifyInstance) {
  // Begin login: stash state+PKCE, redirect to eccuity's authorize endpoint.
  fastify.get('/auth/login', async (_request, reply) => {
    if (!authEnabled) {
      return reply.redirect('/?login=disabled');
    }
    const state = generateState();
    const verifier = generateVerifier();
    const challenge = challengeFromVerifier(verifier);

    reply.setCookie(STATE_COOKIE, state, txCookieOpts(OAUTH_TX_MAX_AGE_S));
    reply.setCookie(VERIFIER_COOKIE, verifier, txCookieOpts(OAUTH_TX_MAX_AGE_S));

    return reply.redirect(buildAuthorizeUrl({ state, codeChallenge: challenge }));
  });

  // OAuth callback: verify state, exchange code, fetch identity, set session.
  fastify.get<{ Querystring: { code?: string; state?: string; error?: string } }>(
    '/auth/callback',
    async (request, reply) => {
      const { code, state, error } = request.query;
      try {
        if (error || !code || !state) return reply.redirect('/?login=error');

        const stateCookie = request.cookies[STATE_COOKIE];
        const verifierCookie = request.cookies[VERIFIER_COOKIE];
        if (!stateCookie || !verifierCookie) return reply.redirect('/?login=expired');

        const unsignedState = request.unsignCookie(stateCookie);
        const unsignedVerifier = request.unsignCookie(verifierCookie);
        if (!unsignedState.valid || !unsignedVerifier.valid || !unsignedVerifier.value) {
          return reply.redirect('/?login=error');
        }
        if (unsignedState.value !== state) return reply.redirect('/?login=error'); // CSRF

        let accessToken: string;
        try {
          accessToken = await exchangeCode({ code, codeVerifier: unsignedVerifier.value });
        } catch (e) {
          lastAuthError = { step: 'exchange', message: (e as Error).message, at: new Date().toISOString() };
          logger.error({ err: e }, 'OAuth token exchange failed');
          return reply.redirect('/?login=error&reason=token');
        }

        let user;
        try {
          user = await fetchCurrentUser(accessToken); // eccuity token discarded after this
        } catch (e) {
          lastAuthError = { step: 'identity', message: (e as Error).message, at: new Date().toISOString() };
          logger.error({ err: e }, 'OAuth identity fetch failed');
          return reply.redirect('/?login=error&reason=identity');
        }

        const token = await reply.jwtSign(
          { sub: user.id, email: user.email, name: user.name, isAdmin: isAdminUser(user.featureFlags) },
          { expiresIn: SESSION_TTL }
        );
        reply.setCookie(SESSION_COOKIE, token, {
          httpOnly: true,
          secure: isProd,
          sameSite: 'lax',
          signed: false, // the JWT signature is the integrity check
          path: '/',
          maxAge: SESSION_MAX_AGE_S,
        });
        reply.clearCookie(STATE_COOKIE, { path: '/api/v1/auth' });
        reply.clearCookie(VERIFIER_COOKIE, { path: '/api/v1/auth' });

        return reply.redirect('/?login=success');
      } catch (err) {
        lastAuthError = { step: 'unknown', message: (err as Error).message, at: new Date().toISOString() };
        logger.error({ err }, 'OAuth callback failed');
        return reply.redirect('/?login=error&reason=unknown');
      }
    }
  );

  // TEMPORARY diagnostic: surfaces the last login failure (step + eccuity
  // response detail; no tokens/PII). Remove once login is confirmed working.
  fastify.get('/auth/debug-last', async (_request, reply) => {
    return reply.send(lastAuthError ?? { step: 'none', message: 'no recent auth error' });
  });

  // Current session (always 200; user is null when anonymous).
  fastify.get('/auth/me', async (request, reply) => {
    if (!authEnabled) {
      return reply.send({ authEnabled: false, user: null });
    }
    try {
      const payload = await request.jwtVerify<{ sub: string; email?: string; name?: string; isAdmin?: boolean }>();
      return reply.send({
        authEnabled: true,
        user: { id: payload.sub, email: payload.email, name: payload.name, isAdmin: !!payload.isAdmin },
      });
    } catch {
      return reply.send({ authEnabled: true, user: null });
    }
  });

  // Log out: clear the session cookie.
  fastify.post('/auth/logout', async (_request, reply) => {
    reply.clearCookie(SESSION_COOKIE, { path: '/' });
    return reply.send({ ok: true });
  });
}
