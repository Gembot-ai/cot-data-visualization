import { FastifyInstance } from 'fastify';
import { MarketsController } from '../controllers/markets.controller';

export async function marketsRoutes(fastify: FastifyInstance) {
  const controller = new MarketsController();

  // GET /api/v1/markets - Get all markets
  fastify.get('/markets', async (request, reply) => {
    return controller.getAll();
  });

  // GET /api/v1/markets/:symbol - Get market by symbol
  fastify.get<{ Params: { symbol: string } }>(
    '/markets/:symbol',
    async (request, reply) => {
      const { symbol } = request.params;
      const result = await controller.getBySymbol(symbol.toUpperCase());

      if (result.code === 404) {
        return reply.code(404).send(result);
      }

      return result;
    }
  );

  // GET /api/v1/markets/category/:category - Get markets by category
  fastify.get<{ Params: { category: string } }>(
    '/markets/category/:category',
    async (request, reply) => {
      const { category } = request.params;
      return controller.getByCategory(category);
    }
  );
}
