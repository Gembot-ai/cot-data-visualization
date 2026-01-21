import { FastifyInstance } from 'fastify';
import { AdminController } from '../controllers/admin.controller';
import { logger } from '../../utils/logger';
import { env } from '../../config/env';

export async function adminRoutes(fastify: FastifyInstance) {
  const controller = new AdminController();

  // Simple auth check - uses ADMIN_KEY env var
  const checkAdminAuth = (request: any, reply: any) => {
    const adminKey = request.headers['x-admin-key'] || request.query.adminKey;
    const expectedKey = env.ADMIN_KEY || process.env.ADMIN_KEY;

    if (!expectedKey) {
      logger.warn('ADMIN_KEY not configured - admin endpoints disabled');
      return reply.code(403).send({ error: 'Admin endpoints not configured' });
    }

    if (adminKey !== expectedKey) {
      return reply.code(401).send({ error: 'Invalid admin key' });
    }
  };

  // GET /api/v1/admin/status - Data health check
  fastify.get('/admin/status', async (request, reply) => {
    try {
      const status = await controller.getDataStatus();
      return status;
    } catch (error) {
      logger.error({ error }, 'Failed to get status');
      return reply.code(500).send({
        error: 'Failed to get status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST /api/v1/admin/validate - Validate data against CFTC
  fastify.post('/admin/validate', async (request, reply) => {
    checkAdminAuth(request, reply);
    if (reply.sent) return;

    try {
      logger.info('Validation triggered via API');
      const result = await controller.validateData();
      return result;
    } catch (error) {
      logger.error({ error }, 'Validation failed');
      return reply.code(500).send({
        error: 'Validation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST /api/v1/admin/refetch - Clear and refetch all data
  fastify.post('/admin/refetch', async (request, reply) => {
    checkAdminAuth(request, reply);
    if (reply.sent) return;

    try {
      logger.info('Full refetch triggered via API');

      // Run in background for large datasets
      const runInBackground = (request.query as any).background === 'true';

      if (runInBackground) {
        // Start refetch in background
        controller.refetchAll()
          .then(result => logger.info({ result }, 'Background refetch completed'))
          .catch(err => logger.error({ err }, 'Background refetch failed'));

        return {
          success: true,
          message: 'Refetch started in background. Check /admin/status for progress.',
          startedAt: new Date().toISOString()
        };
      }

      // Run synchronously (may timeout for large datasets)
      const result = await controller.refetchAll();
      return result;

    } catch (error) {
      logger.error({ error }, 'Refetch failed');
      return reply.code(500).send({
        error: 'Refetch failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST /api/v1/admin/update - Incremental update (existing endpoint moved here)
  fastify.post('/admin/update', async (request, reply) => {
    checkAdminAuth(request, reply);
    if (reply.sent) return;

    try {
      const { fetchAllCotData } = await import('../../scripts/fetch-all-cot-data');

      logger.info('Manual update triggered via API');

      // Run in background
      fetchAllCotData().catch(err => {
        logger.error({ err }, 'Background update failed');
      });

      return {
        success: true,
        message: 'Data update started in background',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error({ error }, 'Failed to trigger update');
      return reply.code(500).send({
        error: 'Failed to trigger update',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}
