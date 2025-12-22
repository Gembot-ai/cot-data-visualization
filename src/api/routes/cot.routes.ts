import { FastifyInstance } from 'fastify';
import { CotController } from '../controllers/cot.controller';

export async function cotRoutes(fastify: FastifyInstance) {
  const controller = new CotController();

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
}
