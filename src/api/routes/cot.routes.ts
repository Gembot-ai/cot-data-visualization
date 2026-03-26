import { FastifyInstance } from 'fastify';
import { CotController } from '../controllers/cot.controller';
import { fetchAllCotData } from '../../scripts/fetch-all-cot-data';
import { logger } from '../../utils/logger';
import { EodPriceService } from '../../services/eod-price.service';

export async function cotRoutes(fastify: FastifyInstance) {
  const controller = new CotController();
  const priceService = new EodPriceService();

  // GET /api/v1/cot/:marketSymbol - Latest CoT for single market
  fastify.get<{ Params: { marketSymbol: string } }>(
    '/cot/:marketSymbol',
    async (request, reply) => {
      const { marketSymbol } = request.params;
      const result = await controller.getLatest(marketSymbol.toUpperCase());

      if (result.code === 404) {
        return reply.code(404).send(result);
      }

      return result;
    }
  );

  // GET /api/v1/cot/:marketSymbol/history - Historical data
  fastify.get<{
    Params: { marketSymbol: string };
    Querystring: { start?: string; end?: string };
  }>(
    '/cot/:marketSymbol/history',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            start: { type: 'string', format: 'date-time' },
            end: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    async (request, reply) => {
      const { marketSymbol } = request.params;
      const { start, end } = request.query;

      const result = await controller.getHistory(
        marketSymbol.toUpperCase(),
        start,
        end
      );

      if (result.code === 404) {
        return reply.code(404).send(result);
      }

      return result;
    }
  );

  // GET /api/v1/cot/batch - Multi-market fetch
  fastify.get<{ Querystring: { markets: string } }>(
    '/cot/batch',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            markets: { type: 'string' }
          },
          required: ['markets']
        }
      }
    },
    async (request, reply) => {
      const { markets } = request.query;
      const marketSymbols = markets.split(',').map(m => m.trim().toUpperCase());
      return controller.getBatch(marketSymbols);
    }
  );

  // GET /api/v1/cot/latest/all - All markets latest data
  fastify.get('/cot/latest/all', async (request, reply) => {
    return controller.getAllLatest();
  });

  // GET /api/v1/cot/:marketSymbol/prices - Asset price data from EODHD
  fastify.get<{
    Params: { marketSymbol: string };
    Querystring: { from?: string; to?: string; report_dates?: string };
  }>(
    '/cot/:marketSymbol/prices',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            from: { type: 'string' },
            to: { type: 'string' },
            report_dates: { type: 'string' },
          }
        }
      }
    },
    async (request, reply) => {
      const { marketSymbol } = request.params;
      const { from, to, report_dates } = request.query;

      try {
        const reportDates = report_dates ? report_dates.split(',') : undefined;
        const result = await priceService.getPrices(
          marketSymbol.toUpperCase(),
          from,
          to,
          reportDates
        );
        return result;
      } catch (error) {
        logger.error({ error, marketSymbol }, 'Failed to fetch price data');
        const message = error instanceof Error ? error.message : 'Unknown error';
        if (message.includes('No EOD ticker mapping')) {
          return reply.code(404).send({ error: message });
        }
        if (message.includes('not configured')) {
          return reply.code(503).send({ error: 'Price data service not configured' });
        }
        return reply.code(500).send({ error: 'Failed to fetch price data' });
      }
    }
  );

  // POST /api/v1/cot/update - Manually trigger data update
  fastify.post('/cot/update', async (request, reply) => {
    try {
      logger.info('Manual update triggered via API');

      // Run update in background, don't wait
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
        success: false,
        message: 'Failed to trigger update',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}
