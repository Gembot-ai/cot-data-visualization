import { MarketsRepository } from '../../database/repositories/markets.repo';
import { logger } from '../../utils/logger';

export class MarketsController {
  private marketsRepo = new MarketsRepository();

  async getAll() {
    try {
      const markets = await this.marketsRepo.findAll();
      return {
        markets,
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
