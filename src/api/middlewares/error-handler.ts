import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { logger } from '../../utils/logger';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  logger.error({
    error,
    url: request.url,
    method: request.method
  }, 'Request error');

  const statusCode = error.statusCode || 500;

  // Don't leak internal details in production
  const message = statusCode >= 500 && process.env.NODE_ENV === 'production'
    ? 'Internal Server Error'
    : error.message || 'Internal Server Error';

  reply.code(statusCode).send({
    error: message,
    statusCode,
    timestamp: new Date().toISOString()
  });
}
