import { CotReportsRepository } from '../../database/repositories/cot-reports.repo';
import { MarketsRepository } from '../../database/repositories/markets.repo';
import { logger } from '../../utils/logger';

export class CotController {
  private reportsRepo = new CotReportsRepository();
  private marketsRepo = new MarketsRepository();

  async getLatest(marketSymbol: string) {
    try {
      const market = await this.marketsRepo.findBySymbol(marketSymbol);
      if (!market) {
        return { error: 'Market not found', code: 404 };
      }

      const report = await this.reportsRepo.findLatestByMarket(market.id);
      if (!report) {
        return { error: 'No data available for this market', code: 404 };
      }

      return {
        market: {
          symbol: market.symbol,
          name: market.name,
          category: market.category
        },
        report
      };
    } catch (error) {
      logger.error({ error, marketSymbol }, 'Failed to get latest CoT data');
      throw error;
    }
  }

  async getHistory(
    marketSymbol: string,
    startDate?: string,
    endDate?: string
  ) {
    try {
      const market = await this.marketsRepo.findBySymbol(marketSymbol);
      if (!market) {
        return { error: 'Market not found', code: 404 };
      }

      let reports;
      if (startDate && endDate) {
        reports = await this.reportsRepo.findByMarketAndDateRange(
          market.id,
          new Date(startDate),
          new Date(endDate)
        );
      } else {
        // Default to 52 weeks
        reports = await this.reportsRepo.findHistoricalByMarket(market.id, 52);
      }

      return {
        market: {
          symbol: market.symbol,
          name: market.name,
          category: market.category
        },
        reports,
        count: reports.length
      };
    } catch (error) {
      logger.error({ error, marketSymbol }, 'Failed to get CoT history');
      throw error;
    }
  }

  async getBatch(marketSymbols: string[]) {
    try {
      const results: any[] = [];

      for (const symbol of marketSymbols) {
        const market = await this.marketsRepo.findBySymbol(symbol);
        if (!market) continue;

        const report = await this.reportsRepo.findLatestByMarket(market.id);
        if (!report) continue;

        results.push({
          market: {
            symbol: market.symbol,
            name: market.name,
            category: market.category
          },
          report
        });
      }

      return {
        results,
        count: results.length
      };
    } catch (error) {
      logger.error({ error, marketSymbols }, 'Failed to get batch CoT data');
      throw error;
    }
  }

  async getAllLatest() {
    try {
      const reports = await this.reportsRepo.findLatestForAllMarkets();
      const markets = await this.marketsRepo.findAll();

      const results = reports.map(report => {
        const market = markets.find(m => m.id === report.market_id);
        return {
          market: market ? {
            symbol: market.symbol,
            name: market.name,
            category: market.category
          } : null,
          report
        };
      });

      return {
        results: results.filter(r => r.market !== null),
        count: results.length
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get all latest CoT data');
      throw error;
    }
  }
}
