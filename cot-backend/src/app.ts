import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { env } from './config/env';
import { cotRoutes } from './api/routes/cot.routes';
import { marketsRoutes } from './api/routes/markets.routes';
import { errorHandler } from './api/middlewares/error-handler';
import { authMiddleware } from './api/middlewares/auth.middleware';
import { logger } from './utils/logger';

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug'
    },
    requestIdLogLabel: 'reqId',
    disableRequestLogging: false
  });

  // CORS
  await fastify.register(fastifyCors, {
    origin: env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  });

  // Global password authentication (if APP_PASSWORD is set)
  if (env.APP_PASSWORD) {
    fastify.addHook('onRequest', authMiddleware);
    logger.info('🔒 App password protection enabled');
  } else {
    logger.info('🔓 App password protection disabled (no APP_PASSWORD set)');
  }

  // API Routes
  await fastify.register(cotRoutes, { prefix: '/api/v1' });
  await fastify.register(marketsRoutes, { prefix: '/api/v1' });

  // Serve static frontend files in production
  if (env.NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, '../../cot-frontend/dist');

    await fastify.register(fastifyStatic, {
      root: frontendPath,
      prefix: '/'
    });

    // SPA fallback - serve index.html for non-API routes
    fastify.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/api/')) {
        reply.code(404).send({ error: 'Not found' });
      } else {
        reply.sendFile('index.html');
      }
    });
  }

  // Error handling
  fastify.setErrorHandler(errorHandler);

  // Health check
  fastify.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }));

  // Root route
  fastify.get('/', async () => ({
    name: 'CoT Data Aggregation API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      markets: '/api/v1/markets',
      cot: '/api/v1/cot/:marketSymbol',
      cotHistory: '/api/v1/cot/:marketSymbol/history',
      cotBatch: '/api/v1/cot/batch?markets=GC,CL,ES'
    }
  }));

  return fastify;
}
