import { FastifyRequest, FastifyReply } from 'fastify';
import { env } from '../../config/env';

/**
 * Simple password authentication middleware
 * Protects the entire app with a single password via HTTP Basic Auth
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

  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return reply
      .code(401)
      .header('WWW-Authenticate', 'Basic realm="CoT Data App"')
      .send({ error: 'Authentication required' });
  }

  // Parse Basic Auth header
  const base64Credentials = authHeader.split(' ')[1];
  if (!base64Credentials) {
    return reply
      .code(401)
      .header('WWW-Authenticate', 'Basic realm="CoT Data App"')
      .send({ error: 'Invalid authorization header' });
  }

  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  // Check password (username can be anything)
  if (password !== env.APP_PASSWORD) {
    return reply
      .code(401)
      .header('WWW-Authenticate', 'Basic realm="CoT Data App"')
      .send({ error: 'Invalid password' });
  }

  // Authentication successful
}
