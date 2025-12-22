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

  reply.code(statusCode).send({
    error: error.message || 'Internal Server Error',
    statusCode,
    timestamp: new Date().toISOString()
  });
}
