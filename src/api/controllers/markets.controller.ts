import { MarketsRepository } from '../../database/repositories/markets.repo';
import { pool } from '../../config/database';
import { logger } from '../../utils/logger';

export class MarketsController {
  private marketsRepo = new MarketsRepository();

  async getAll() {
    try {
      const markets = await this.marketsRepo.findAll();

      // Get data availability stats for each market
      const statsQuery = await pool.query(`
        SELECT
          m.id,
          m.symbol,
          COUNT(c.id) as data_count,
          MIN(c.report_date) as earliest_date,
          MAX(c.report_date) as latest_date
        FROM markets m
        LEFT JOIN cot_reports c ON m.id = c.market_id
        WHERE m.active = true
        GROUP BY m.id, m.symbol
      `);

      const statsMap = new Map();
      statsQuery.rows.forEach(row => {
        statsMap.set(row.symbol, {
          dataCount: parseInt(row.data_count),
          earliestDate: row.earliest_date,
          latestDate: row.latest_date,
          hasData: parseInt(row.data_count) > 0
        });
      });

      // Enrich markets with data availability
      const enrichedMarkets = markets.map(market => ({
        ...market,
        dataAvailability: statsMap.get(market.symbol) || {
          dataCount: 0,
          earliestDate: null,
          latestDate: null,
          hasData: false
        }
      }));

      return {
        markets: enrichedMarkets,
        count: markets.length
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get all markets');
      throw error;
    }
  }

  async getBySymbol(symbol: string) {
    try {
      const market = await this.marketsRepo.findBySymbol(symbol);
      if (!market) {
        return { error: 'Market not found', code: 404 };
      }
      return { market };
    } catch (error) {
      logger.error({ error, symbol }, 'Failed to get market by symbol');
      throw error;
    }
  }

  async getByCategory(category: string) {
    try {
      const markets = await this.marketsRepo.findByCategory(category);
      return {
        category,
        markets,
        count: markets.length
      };
    } catch (error) {
      logger.error({ error, category }, 'Failed to get markets by category');
      throw error;
    }
  }
}
