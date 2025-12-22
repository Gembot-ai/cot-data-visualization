import axios from 'axios';
import pRetry from 'p-retry';
import { logger } from '../utils/logger';
import { env } from '../config/env';

interface CFTCApiResponse {
  data: Array<{
    market_and_exchange_names: string;
    contract_code: string;
    report_date_as_yyyy_mm_dd: string;
    comm_positions_long_all: number;
    comm_positions_short_all: number;
    comm_positions_spread_all?: number;
    noncomm_positions_long_all: number;
    noncomm_positions_short_all: number;
    noncomm_positions_spread_all?: number;
    open_interest_all: number;
    change_in_comm_long_all?: number;
    change_in_comm_short_all?: number;
    change_in_noncomm_long_all?: number;
    change_in_noncomm_short_all?: number;
  }>;
}

export class DataFetcherService {
  private readonly CFTC_API_BASE = env.CFTC_API_BASE;

  /**
   * Fetch latest CoT reports for specific markets
   * Runs via BullMQ job every Friday 4 PM EST
   */
  async fetchWeeklyReports(marketSymbols: string[]): Promise<CFTCApiResponse> {
    try {
      const params = {
        report_type_name: 'legacy_fut',
        limit: 1000,
        format: 'json'
      };

      const response = await pRetry(
        async () => {
          const result = await axios.get(
            `${this.CFTC_API_BASE}commitmentoftraders`,
            { params, timeout: 30000 }
          );
          return result.data;
        },
        {
          retries: 3,
          minTimeout: 1000,
          maxTimeout: 30000,
          onFailedAttempt: (error) => {
            logger.warn({
              attempt: error.attemptNumber,
              retriesLeft: error.retriesLeft,
              error: error.message
            }, 'CFTC API retry');
          }
        }
      );

      return response;
    } catch (error: any) {
      logger.error({ error }, 'Failed to fetch CFTC data after retries');
      throw new Error(`CFTC API fetch failed: ${error.message}`);
    }
  }

  /**
   * One-time backfill for historical data (52 weeks prior)
   */
  async backfillHistoricalData(
    marketSymbol: string,
    weeksBack: number = 52
  ): Promise<void> {
    logger.info({
      market: marketSymbol,
      weeksBack
    }, 'Starting historical backfill');

    try {
      const params = {
        report_type_name: 'legacy_fut',
        limit: weeksBack * 10, // Fetch more to ensure coverage
        format: 'json'
      };

      await this.fetchWeeklyReports([marketSymbol]);

      logger.info({ market: marketSymbol }, 'Historical backfill completed');
    } catch (error: any) {
      logger.error({ error, market: marketSymbol }, 'Historical backfill failed');
      throw error;
    }
  }

  /**
   * Validate that all expected markets are in the response
   */
  validateReportCompleteness(
    response: CFTCApiResponse,
    expectedMarkets: number
  ): boolean {
    if (!response.data || response.data.length === 0) {
      return false;
    }

    const uniqueMarkets = new Set(
      response.data.map(r => r.market_and_exchange_names)
    );

    // Allow 10% missing markets
    return uniqueMarkets.size >= expectedMarkets * 0.9;
  }

  /**
   * Get market symbols from contract codes
   */
  parseMarketFromResponse(item: any): string {
    // Extract market symbol from CFTC contract code
    const contractCode = item.contract_code || '';
    return contractCode.substring(0, 2);
  }
}
