import axios from 'axios';
import { pool } from '../config/database';
import { logger } from '../utils/logger';
import { MarketsRepository } from '../database/repositories/markets.repo';
import { CotReportsRepository } from '../database/repositories/cot-reports.repo';
import { matchesCFTCMarketName } from '../utils/cftc-market-names';

/**
 * Fetch ALL available CoT data from CFTC API
 * This will fetch the maximum available historical data for all markets
 * Usage: npm run fetch-all
 */

// Using LEGACY Futures format - simpler and covers all our markets
const CFTC_API_BASE = 'https://publicreporting.cftc.gov/resource/6dca-aqww.json';

interface CFTCRecord {
  market_and_exchange_names: string;
  cftc_contract_market_code: string;
  report_date_as_yyyy_mm_dd: string;
  open_interest_all: string;
  comm_positions_long_all: string;
  comm_positions_short_all: string;
  noncomm_positions_long_all: string;
  noncomm_positions_short_all: string;
  nonrept_positions_long_all: string;
  nonrept_positions_short_all: string;
  change_in_comm_long_all?: string;
  change_in_comm_short_all?: string;
  change_in_noncomm_long_all?: string;
  change_in_noncomm_short_all?: string;
}

async function fetchAllCotData() {
  const startTime = Date.now();

  try {
    const marketsRepo = new MarketsRepository();
    const reportsRepo = new CotReportsRepository();

    // Get all markets
    const markets = await marketsRepo.findAll();
    logger.info({ count: markets.length }, 'Markets loaded from database');

    // Check latest report date in database
    const latestReport = await pool.query(`
      SELECT MAX(report_date) as latest_date
      FROM cot_reports
      WHERE source = 'CFTC_API'
    `);

    let startDate = '2000-01-01';
    if (latestReport.rows[0]?.latest_date) {
      // Fetch from 30 days before the latest date to ensure we don't miss any updates
      const latest = new Date(latestReport.rows[0].latest_date);
      latest.setDate(latest.getDate() - 30);
      startDate = latest.toISOString().split('T')[0];
      logger.info(`📊 Found existing data up to ${latestReport.rows[0].latest_date}, fetching from ${startDate}...`);
    } else {
      logger.info('🚀 No existing data found, starting comprehensive fetch from 2000-01-01...');
    }

    // Create market name to ID map
    const marketMap = new Map<string, number>();
    markets.forEach(m => {
      marketMap.set(m.name.toUpperCase(), m.id);
      marketMap.set(m.symbol.toUpperCase(), m.id);
    });

    let totalFetched = 0;
    let totalSaved = 0;
    const limit = 1000; // Smaller batches for stability
    let offset = 0;
    let hasMore = true;
    const maxBatches = 500; // Increased to fetch all historical data from 2000 (500k records max)
    let batchCount = 0;

    while (hasMore && batchCount < maxBatches) {
      batchCount++;
      logger.info({ offset, limit, batch: batchCount }, 'Fetching batch from CFTC...');

      try {
        // Fetch from CFTC Legacy Futures format from 2000 onwards
        const response = await axios.get(CFTC_API_BASE, {
          params: {
            '$limit': limit,
            '$offset': offset,
            '$order': 'report_date_as_yyyy_mm_dd DESC',
            '$where': `report_date_as_yyyy_mm_dd >= '${startDate}'`
          },
          timeout: 60000
        });

        const records: CFTCRecord[] = response.data;

        if (!records || records.length === 0) {
          hasMore = false;
          break;
        }

        totalFetched += records.length;
        logger.info({
          batchSize: records.length,
          totalFetched
        }, 'Batch received from CFTC');

        // Process and save records
        for (const record of records) {
          try {
            // Try to match market using proper CFTC name mapping
            const cftcMarketName = record.market_and_exchange_names || '';
            let marketId: number | undefined;
            let matchedSymbol: string | undefined;

            // Try matching using CFTC market name patterns
            for (const market of markets) {
              if (matchesCFTCMarketName(cftcMarketName, market.symbol)) {
                marketId = market.id;
                matchedSymbol = market.symbol;
                break;
              }
            }

            if (!marketId) {
              // Skip markets we don't track
              continue;
            }

            // Parse report date
            const reportDate = new Date(record.report_date_as_yyyy_mm_dd);
            const publishDate = new Date(reportDate);
            publishDate.setDate(publishDate.getDate() + 3); // Friday publish

            // Legacy format - direct mapping
            const commercialLong = parseInt(record.comm_positions_long_all || '0');
            const commercialShort = parseInt(record.comm_positions_short_all || '0');
            const nonCommercialLong = parseInt(record.noncomm_positions_long_all || '0');
            const nonCommercialShort = parseInt(record.noncomm_positions_short_all || '0');
            const nonReportableLong = parseInt(record.nonrept_positions_long_all || '0');
            const nonReportableShort = parseInt(record.nonrept_positions_short_all || '0');
            const openInterest = parseInt(record.open_interest_all || '0');

            // Insert into database
            await pool.query(
              `INSERT INTO cot_reports (
                market_id, report_date, publish_date,
                commercial_long, commercial_short,
                non_commercial_long, non_commercial_short,
                non_reportable_long, non_reportable_short,
                open_interest,
                source
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
              ON CONFLICT DO NOTHING`,
              [
                marketId,
                reportDate,
                publishDate,
                commercialLong,
                commercialShort,
                nonCommercialLong,
                nonCommercialShort,
                nonReportableLong,
                nonReportableShort,
                openInterest,
                'CFTC_API'
              ]
            );

            totalSaved++;
          } catch (error: any) {
            // Log but continue processing
            logger.debug({ error: error.message }, 'Skipped record');
          }
        }

        logger.info({ totalSaved }, `Saved ${totalSaved} reports so far...`);

        // Check if we should continue
        if (records.length < limit) {
          hasMore = false;
        } else {
          offset += limit;
        }

        // Rate limiting - be nice to CFTC servers
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        logger.error({ error: error.message, offset }, 'Batch fetch failed');
        hasMore = false;
      }
    }

    const duration = Date.now() - startTime;
    logger.info({
      totalFetched,
      totalSaved,
      duration: `${(duration / 1000).toFixed(2)}s`,
      durationMinutes: `${(duration / 60000).toFixed(2)} min`
    }, '✅ CoT data fetch completed!');

    // Show summary by market
    const summary = await pool.query(`
      SELECT m.symbol, m.name, COUNT(*) as report_count
      FROM cot_reports r
      JOIN markets m ON m.id = r.market_id
      WHERE r.source = 'CFTC_API'
      GROUP BY m.id, m.symbol, m.name
      ORDER BY report_count DESC
    `);

    logger.info('📊 Reports by market:');
    summary.rows.forEach(row => {
      logger.info(`  ${row.symbol}: ${row.report_count} reports - ${row.name}`);
    });

    // Show date range
    const dateRange = await pool.query(`
      SELECT
        MIN(report_date) as earliest_date,
        MAX(report_date) as latest_date,
        COUNT(*) as total_reports
      FROM cot_reports
      WHERE source = 'CFTC_API'
    `);

    if (dateRange.rows.length > 0) {
      logger.info('📅 Data range:', {
        from: dateRange.rows[0].earliest_date,
        to: dateRange.rows[0].latest_date,
        totalReports: dateRange.rows[0].total_reports
      });
    }

  } catch (error) {
    logger.error({ error }, 'Failed to fetch CoT data');
    throw error;
  }
}

// Export for use in other scripts
export { fetchAllCotData };

// Run directly if this is the main module
if (require.main === module) {
  fetchAllCotData()
    .then(() => {
      logger.info('✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      logger.error({ error }, '❌ Failed');
      process.exit(1);
    })
    .finally(() => {
      pool.end();
    });
}
