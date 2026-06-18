import { FastifyInstance } from 'fastify';
import { CotController } from '../controllers/cot.controller';
import { logger } from '../../utils/logger';
import { EodPriceService } from '../../services/eod-price.service';
import { CFTC_CONTRACT_CODES } from '../../config/cftc-contract-codes';
import { optionalAuth } from '../middlewares/optional-auth';
import { recentWindowStart } from '../../config/auth';

const VALID_SYMBOLS = new Set(Object.keys(CFTC_CONTRACT_CODES));
const MAX_BATCH_SYMBOLS = 10;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?Z?)?$/;

function isValidSymbol(symbol: string): boolean {
  return VALID_SYMBOLS.has(symbol.toUpperCase());
}

function isValidDate(date: string): boolean {
  return DATE_REGEX.test(date) && !isNaN(Date.parse(date));
}

export async function cotRoutes(fastify: FastifyInstance) {
  const controller = new CotController();
  const priceService = new EodPriceService();

  // GET /api/v1/cot/:marketSymbol - Latest CoT for single market
  fastify.get<{ Params: { marketSymbol: string } }>(
    '/cot/:marketSymbol',
    async (request, reply) => {
      const { marketSymbol } = request.params;
      const symbol = marketSymbol.toUpperCase();

      if (!isValidSymbol(symbol)) {
        return reply.code(400).send({ error: 'Invalid market symbol' });
      }

      const result = await controller.getLatest(symbol);

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
      preHandler: optionalAuth,
      schema: {
        querystring: {
          type: 'object',
          properties: {
            start: { type: 'string' },
            end: { type: 'string' }
          }
        }
      }
    },
    async (request, reply) => {
      const { marketSymbol } = request.params;
      const { start, end } = request.query;
      const symbol = marketSymbol.toUpperCase();

      if (!isValidSymbol(symbol)) {
        return reply.code(400).send({ error: 'Invalid market symbol' });
      }

      if (start && !isValidDate(start)) {
        return reply.code(400).send({ error: 'Invalid start date format' });
      }
      if (end && !isValidDate(end)) {
        return reply.code(400).send({ error: 'Invalid end date format' });
      }

      // Anonymous users are clamped to the recent window inside the controller.
      const result = await controller.getHistory(symbol, start, end, request.isLoggedIn);

      if (result.code === 404) {
        return reply.code(404).send(result);
      }

      return result;
    }
  );

  // GET /api/v1/cot/batch - Multi-market fetch (max 10)
  fastify.get<{ Querystring: { markets: string } }>(
    '/cot/batch',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            markets: { type: 'string', maxLength: 200 }
          },
          required: ['markets']
        }
      }
    },
    async (request, reply) => {
      const { markets } = request.query;
      const marketSymbols = markets.split(',').map(m => m.trim().toUpperCase());

      if (marketSymbols.length > MAX_BATCH_SYMBOLS) {
        return reply.code(400).send({ error: `Maximum ${MAX_BATCH_SYMBOLS} symbols per batch request` });
      }

      const invalid = marketSymbols.filter(s => !isValidSymbol(s));
      if (invalid.length > 0) {
        return reply.code(400).send({ error: `Invalid market symbols: ${invalid.join(', ')}` });
      }

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
      preHandler: optionalAuth,
      schema: {
        querystring: {
          type: 'object',
          properties: {
            from: { type: 'string' },
            to: { type: 'string' },
            // The frontend sends one date per COT report for the full history
            // (~52/year). At ~11 chars each, 10 years ≈ 5,900 chars, which
            // exceeded the old 5,000 cap and caused a 400 — so prices silently
            // failed to load. 12,000 covers ~20 years while staying well under
            // Node's ~16KB request-line limit.
            report_dates: { type: 'string', maxLength: 12000 },
          }
        }
      }
    },
    async (request, reply) => {
      const { marketSymbol } = request.params;
      const { from, to, report_dates } = request.query;
      const symbol = marketSymbol.toUpperCase();

      if (!isValidSymbol(symbol)) {
        return reply.code(400).send({ error: 'Invalid market symbol' });
      }

      if (from && !isValidDate(from)) {
        return reply.code(400).send({ error: 'Invalid from date format' });
      }
      if (to && !isValidDate(to)) {
        return reply.code(400).send({ error: 'Invalid to date format' });
      }

      try {
        let reportDates = report_dates ? report_dates.split(',') : undefined;
        let effectiveFrom = from;

        // Anonymous: clamp the price overlay to the recent window (matches the
        // history gate) so older prices can't be fetched without logging in.
        if (!request.isLoggedIn) {
          const windowStart = recentWindowStart().toISOString().split('T')[0];
          reportDates = reportDates?.filter((d) => d >= windowStart);
          effectiveFrom = from && from >= windowStart ? from : windowStart;
        }

        const result = await priceService.getPrices(symbol, effectiveFrom, to, reportDates);
        return result;
      } catch (error) {
        logger.error({ error, marketSymbol: symbol }, 'Failed to fetch price data');
        const message = error instanceof Error ? error.message : 'Unknown error';
        if (message.includes('No EOD ticker mapping')) {
          return reply.code(404).send({ error: 'Price data not available for this market' });
        }
        if (message.includes('not configured')) {
          return reply.code(503).send({ error: 'Price data service not available' });
        }
        return reply.code(500).send({ error: 'Failed to fetch price data' });
      }
    }
  );

  // NOTE: /cot/update removed from public routes — use /admin/update with auth instead
}
