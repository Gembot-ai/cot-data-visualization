import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import path from 'path';
import { env } from './config/env';
import { SESSION_COOKIE, authEnabled } from './config/auth';
import { cotRoutes } from './api/routes/cot.routes';
import { marketsRoutes } from './api/routes/markets.routes';
import { adminRoutes } from './api/routes/admin.routes';
import { authRoutes } from './api/routes/auth.routes';
import { errorHandler } from './api/middlewares/error-handler';
import { logger } from './utils/logger';

export async function buildApp() {
  const fastify = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug'
    },
    requestIdLogLabel: 'reqId',
    disableRequestLogging: false
  });

  // Security headers
  await fastify.register(fastifyHelmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  });

  // Rate limiting
  await fastify.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // CORS
  await fastify.register(fastifyCors, {
    origin: env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  });

  // Cookies + JWT sessions (eccuity OAuth login). The session JWT lives in the
  // httpOnly `cot_session` cookie; @fastify/jwt is configured to read it.
  await fastify.register(fastifyCookie, { secret: env.COOKIE_SECRET });
  await fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    cookie: { cookieName: SESSION_COOKIE, signed: false },
  });
  logger.info({ authEnabled }, authEnabled
    ? 'eccuity OAuth login enabled'
    : 'eccuity OAuth login disabled (set ECCUITY_CLIENT_ID to enable)');

  // API Routes
  await fastify.register(authRoutes, { prefix: '/api/v1' });
  await fastify.register(cotRoutes, { prefix: '/api/v1' });
  await fastify.register(marketsRoutes, { prefix: '/api/v1' });
  await fastify.register(adminRoutes, { prefix: '/api/v1' });

  // Error handling
  fastify.setErrorHandler(errorHandler);

  // Health check
  fastify.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }));

  // Serve static frontend files in production
  if (env.NODE_ENV === 'production') {
    const frontendPath = path.join(__dirname, '../cot-frontend/dist');
    logger.info({ path: frontendPath }, 'Serving frontend from path');

    await fastify.register(fastifyStatic, {
      root: frontendPath,
      prefix: '/'
    });

    // SPA fallback - serve index.html for all non-API routes
    fastify.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/api/')) {
        reply.code(404).send({ error: 'Not found' });
      } else {
        reply.sendFile('index.html');
      }
    });

    logger.info('Frontend static files registered');
  } else {
    // API info route (only in development)
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
  }

  return fastify;
}
