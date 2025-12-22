import { FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../../config/env';

/**
 * Simple password-only authentication middleware
 * Protects the entire app with a single password
 * Accepts password in two ways:
 * 1. Query param: ?password=YOUR_PASSWORD
 * 2. HTTP Basic Auth (username can be anything, only password checked)
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Skip auth if no password is set
  if (!env.APP_PASSWORD) {
    return;
  }

  // Skip auth for health check
  if (request.url === '/health') {
    return;
  }

  // Check query parameter first (easiest for browser access)
  const queryParams = request.query as any;
  if (queryParams?.password === env.APP_PASSWORD) {
    return; // Authentication successful
  }

  // Check HTTP Basic Auth (for API clients)
  const authHeader = request.headers.authorization;
  if (authHeader) {
    const base64Credentials = authHeader.split(' ')[1];
    if (base64Credentials) {
      const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
      const parts = credentials.split(':');
      const password = parts.length > 1 ? parts[1] : parts[0]; // Accept either "password" or "user:password"

      if (password === env.APP_PASSWORD) {
        return; // Authentication successful
      }
    }
  }

  // Authentication failed
  return reply
    .code(401)
    .header('WWW-Authenticate', 'Basic realm="CoT Data App"')
    .send({
      error: 'Authentication required',
      hint: 'Add ?password=YOUR_PASSWORD to the URL or use HTTP Basic Auth'
    });
}
