import { FastifyRequest, FastifyReply } from 'fastify';
import { authEnabled } from '../../config/auth';

declare module 'fastify' {
  interface FastifyRequest {
    isLoggedIn: boolean;
  }
}

/**
 * Populates request.isLoggedIn from the session-cookie JWT. NEVER rejects —
 * an absent/invalid/expired session is simply treated as anonymous.
 *
 * Safe rollout: when OAuth login is not configured (authEnabled=false, i.e. no
 * ECCUITY_CLIENT_ID), everyone is treated as full-access so the gating stays
 * dormant until eccuity credentials are set in the environment.
 */
export async function optionalAuth(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  if (!authEnabled) {
    request.isLoggedIn = true;
    return;
  }
  try {
    await request.jwtVerify(); // reads the cot_session cookie (configured in app.ts)
    request.isLoggedIn = true;
  } catch {
    request.isLoggedIn = false;
  }
}
