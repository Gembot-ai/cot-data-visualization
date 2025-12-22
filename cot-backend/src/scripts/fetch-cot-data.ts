import { DataFetcherService } from '../services/data-fetcher.service';
import { DataTransformerService } from '../services/data-transformer.service';
import { MarketsRepository } from '../database/repositories/markets.repo';
import { CotReportsRepository } from '../database/repositories/cot-reports.repo';
import { logger } from '../utils/logger';
import { pool } from '../config/database';

/**
 * Manual script to fetch CoT data from CFTC API
 * Usage: npm run fetch-data
 */
async function fetchCotData() {
  const startTime = Date.now();

  try {
    logger.info('Starting CoT data fetch...');

    const fetcherService = new DataFetcherService();
    const transformerService = new DataTransformerService();
    const marketsRepo = new MarketsRepository();
    const reportsRepo = new CotReportsRepository();

    // Get all active markets
    const markets = await marketsRepo.findAll();
    logger.info({ count: markets.length }, 'Fetching data for markets');

    // Fetch from CFTC API
    const marketSymbols = markets.map(m => m.symbol);
    const response = await fetcherService.fetchWeeklyReports(marketSymbols);

    if (!response.data || response.data.length === 0) {
      logger.warn('No data returned from CFTC API');
      return;
    }

    logger.info({ records: response.data.length }, 'Data fetched from CFTC');

    // Transform and save data
    let insertedCount = 0;
    const reports = [];

    for (const rawReport of response.data) {
      try {
        // Find matching market
        const marketSymbol = fetcherService.parseMarketFromResponse(rawReport);
        const market = markets.find(m =>
          m.symbol === marketSymbol ||
          rawReport.market_and_exchange_names?.includes(m.name)
        );

        if (!market) {
          logger.debug({ rawReport }, 'Market not found for report');
          continue;
        }

        // Transform to internal format
        const transformed = transformerService.transformCFTCResponse(
          rawReport,
          market.id
        );

        reports.push(transformed);
      } catch (error: any) {
        logger.error({ error, rawReport }, 'Failed to transform report');
      }
    }

    // Bulk insert
    if (reports.length > 0) {
      insertedCount = await reportsRepo.bulkCreate(reports);
      logger.info({ inserted: insertedCount }, 'Reports saved to database');
    }

    const duration = Date.now() - startTime;
    logger.info({
      duration: `${duration}ms`,
      fetched: response.data.length,
      inserted: insertedCount
    }, 'CoT data fetch completed successfully');

    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Failed to fetch CoT data');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fetchCotData();
