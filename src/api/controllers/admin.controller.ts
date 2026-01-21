import axios from 'axios';
import { pool } from '../../config/database';
import { logger } from '../../utils/logger';
import { CFTC_CONTRACT_CODES } from '../../config/cftc-contract-codes';
import { fetchAllCotData } from '../../scripts/fetch-all-cot-data';

const CFTC_API_BASE = 'https://publicreporting.cftc.gov/resource/6dca-aqww.json';

interface ValidationResult {
  symbol: string;
  cftcCode: string;
  reportDate: string;
  field: string;
  ourValue: number;
  cftcValue: number;
  difference: number;
  percentDiff: number;
}

export class AdminController {
  /**
   * Validate data against CFTC API
   */
  async validateData() {
    const errors: ValidationResult[] = [];
    const validated: string[] = [];
    const skipped: string[] = [];

    try {
      logger.info('Starting COT data validation...');

      // Get all markets
      const marketsResult = await pool.query(`
        SELECT id, symbol, name FROM markets WHERE active = true
      `);

      for (const market of marketsResult.rows) {
        const cftcCode = CFTC_CONTRACT_CODES[market.symbol];

        if (!cftcCode) {
          skipped.push(market.symbol);
          continue;
        }

        try {
          // Fetch latest from CFTC
          const cftcResponse = await axios.get(CFTC_API_BASE, {
            params: {
              '$where': `cftc_contract_market_code = '${cftcCode}'`,
              '$order': 'report_date_as_yyyy_mm_dd DESC',
              '$limit': 1
            },
            timeout: 30000
          });

          const cftcRecord = cftcResponse.data[0];
          if (!cftcRecord) {
            skipped.push(market.symbol);
            continue;
          }

          const cftcDate = cftcRecord.report_date_as_yyyy_mm_dd.split('T')[0];

          // Get our data
          const ourResult = await pool.query(`
            SELECT commercial_long, commercial_short,
                   non_commercial_long, non_commercial_short,
                   non_reportable_long, non_reportable_short,
                   open_interest
            FROM cot_reports
            WHERE market_id = $1 AND report_date = $2
          `, [market.id, cftcDate]);

          if (ourResult.rows.length === 0) {
            errors.push({
              symbol: market.symbol,
              cftcCode,
              reportDate: cftcDate,
              field: 'MISSING',
              ourValue: 0,
              cftcValue: 1,
              difference: 1,
              percentDiff: 100
            });
            continue;
          }

          const ourData = ourResult.rows[0];

          // Compare key fields
          const comparisons = [
            { field: 'open_interest', ours: Number(ourData.open_interest), cftc: parseInt(cftcRecord.open_interest_all) },
            { field: 'commercial_long', ours: Number(ourData.commercial_long), cftc: parseInt(cftcRecord.comm_positions_long_all) },
            { field: 'commercial_short', ours: Number(ourData.commercial_short), cftc: parseInt(cftcRecord.comm_positions_short_all) },
            { field: 'non_commercial_long', ours: Number(ourData.non_commercial_long), cftc: parseInt(cftcRecord.noncomm_positions_long_all) },
            { field: 'non_commercial_short', ours: Number(ourData.non_commercial_short), cftc: parseInt(cftcRecord.noncomm_positions_short_all) },
          ];

          let hasError = false;
          for (const { field, ours, cftc } of comparisons) {
            const diff = Math.abs(ours - cftc);
            const percentDiff = cftc !== 0 ? (diff / cftc) * 100 : (ours !== 0 ? 100 : 0);

            if (percentDiff > 1 || diff > 100) {
              hasError = true;
              errors.push({
                symbol: market.symbol,
                cftcCode,
                reportDate: cftcDate,
                field,
                ourValue: ours,
                cftcValue: cftc,
                difference: diff,
                percentDiff: Math.round(percentDiff * 100) / 100
              });
            }
          }

          if (!hasError) {
            validated.push(market.symbol);
          }

          // Rate limit
          await new Promise(resolve => setTimeout(resolve, 300));

        } catch (err) {
          logger.error({ symbol: market.symbol, err }, 'Failed to validate market');
          skipped.push(market.symbol);
        }
      }

      return {
        success: errors.length === 0,
        summary: {
          validated: validated.length,
          errors: errors.length,
          skipped: skipped.length
        },
        validated,
        errors,
        skipped
      };

    } catch (error) {
      logger.error({ error }, 'Validation failed');
      throw error;
    }
  }

  /**
   * Refetch all data (clears and re-fetches)
   * Fetches last 10 years of data for comprehensive historical coverage
   */
  async refetchAll(yearsToFetch: number = 10) {
    try {
      logger.info({ yearsToFetch }, 'Starting complete data refetch...');

      // Get current count
      const beforeCount = await pool.query(`SELECT COUNT(*) as count FROM cot_reports`);

      // Delete all existing data
      const deleteResult = await pool.query(`DELETE FROM cot_reports WHERE source = 'CFTC_API'`);
      await pool.query(`DELETE FROM cot_metrics`);
      await pool.query(`DELETE FROM cot_trends`);

      logger.info({ deleted: deleteResult.rowCount }, 'Cleared existing data');

      // Fetch fresh data - 10 years gives good historical context
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - yearsToFetch);
      const startDateStr = startDate.toISOString().split('T')[0];

      logger.info({ startDate: startDateStr, yearsToFetch }, 'Fetching data from CFTC...');

      // Get all markets
      const marketsResult = await pool.query(`SELECT id, symbol FROM markets WHERE active = true`);
      const markets = marketsResult.rows;

      // Build CFTC code map
      const cftcCodeToMarket = new Map<string, { id: number; symbol: string }>();
      for (const market of markets) {
        const cftcCode = CFTC_CONTRACT_CODES[market.symbol];
        if (cftcCode) {
          cftcCodeToMarket.set(cftcCode, { id: market.id, symbol: market.symbol });
        }
      }

      let totalSaved = 0;
      let offset = 0;
      const limit = 5000; // Larger batches for efficiency
      let hasMore = true;
      let batchNum = 0;

      while (hasMore) {
        batchNum++;
        logger.info({ batch: batchNum, offset, totalSaved }, 'Fetching batch from CFTC...');

        const response = await axios.get(CFTC_API_BASE, {
          params: {
            '$limit': limit,
            '$offset': offset,
            '$order': 'report_date_as_yyyy_mm_dd DESC',
            '$where': `report_date_as_yyyy_mm_dd >= '${startDateStr}'`
          },
          timeout: 120000 // 2 minute timeout for larger batches
        });

        const records = response.data;
        if (!records || records.length === 0) {
          hasMore = false;
          break;
        }

        // Batch insert for much better performance
        const inserts: any[][] = [];
        for (const record of records) {
          const marketMatch = cftcCodeToMarket.get(record.cftc_contract_market_code);
          if (!marketMatch) continue;

          const reportDate = new Date(record.report_date_as_yyyy_mm_dd);
          const publishDate = new Date(reportDate);
          publishDate.setDate(publishDate.getDate() + 3);

          inserts.push([
            marketMatch.id,
            reportDate,
            publishDate,
            parseInt(record.comm_positions_long_all || '0'),
            parseInt(record.comm_positions_short_all || '0'),
            parseInt(record.noncomm_positions_long_all || '0'),
            parseInt(record.noncomm_positions_short_all || '0'),
            parseInt(record.nonrept_positions_long_all || '0'),
            parseInt(record.nonrept_positions_short_all || '0'),
            parseInt(record.open_interest_all || '0'),
            'CFTC_API'
          ]);
        }

        // Batch insert using a transaction
        if (inserts.length > 0) {
          const client = await pool.connect();
          try {
            await client.query('BEGIN');
            for (const values of inserts) {
              await client.query(
                `INSERT INTO cot_reports (
                  market_id, report_date, publish_date,
                  commercial_long, commercial_short,
                  non_commercial_long, non_commercial_short,
                  non_reportable_long, non_reportable_short,
                  open_interest, source
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                ON CONFLICT (market_id, report_date) DO UPDATE SET
                  commercial_long = EXCLUDED.commercial_long,
                  commercial_short = EXCLUDED.commercial_short,
                  non_commercial_long = EXCLUDED.non_commercial_long,
                  non_commercial_short = EXCLUDED.non_commercial_short,
                  non_reportable_long = EXCLUDED.non_reportable_long,
                  non_reportable_short = EXCLUDED.non_reportable_short,
                  open_interest = EXCLUDED.open_interest,
                  updated_at = CURRENT_TIMESTAMP`,
                values
              );
            }
            await client.query('COMMIT');
            totalSaved += inserts.length;
          } catch (err) {
            await client.query('ROLLBACK');
            throw err;
          } finally {
            client.release();
          }
        }

        logger.info({ totalSaved, batchSize: records.length }, 'Batch processed');

        if (records.length < limit) {
          hasMore = false;
        } else {
          offset += limit;
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Get new count
      const afterCount = await pool.query(`SELECT COUNT(*) as count FROM cot_reports WHERE source = 'CFTC_API'`);

      // Get summary by market
      const summary = await pool.query(`
        SELECT m.symbol, COUNT(*) as count,
               MIN(r.report_date) as earliest,
               MAX(r.report_date) as latest
        FROM cot_reports r
        JOIN markets m ON m.id = r.market_id
        WHERE r.source = 'CFTC_API'
        GROUP BY m.symbol
        ORDER BY m.symbol
      `);

      logger.info({ totalSaved, markets: summary.rows.length }, 'Refetch completed');

      return {
        success: true,
        beforeCount: parseInt(beforeCount.rows[0].count),
        afterCount: parseInt(afterCount.rows[0].count),
        deleted: deleteResult.rowCount,
        totalFetched: totalSaved,
        markets: summary.rows
      };

    } catch (error) {
      logger.error({ error }, 'Refetch failed');
      throw error;
    }
  }

  /**
   * Get data status/health check
   */
  async getDataStatus() {
    try {
      const [totalCount, latestDate, marketCounts, dateRange] = await Promise.all([
        pool.query(`SELECT COUNT(*) as count FROM cot_reports WHERE source = 'CFTC_API'`),
        pool.query(`SELECT MAX(report_date) as latest FROM cot_reports WHERE source = 'CFTC_API'`),
        pool.query(`
          SELECT m.symbol, m.name, COUNT(*) as report_count,
                 MAX(r.report_date) as latest_report,
                 MAX(r.open_interest) as latest_oi
          FROM cot_reports r
          JOIN markets m ON m.id = r.market_id
          WHERE r.source = 'CFTC_API'
          GROUP BY m.id, m.symbol, m.name
          ORDER BY m.symbol
        `),
        pool.query(`
          SELECT MIN(report_date) as earliest, MAX(report_date) as latest
          FROM cot_reports WHERE source = 'CFTC_API'
        `)
      ]);

      // Check latest CFTC date
      let cftcLatestDate = null;
      try {
        const cftcResponse = await axios.get(CFTC_API_BASE, {
          params: {
            '$limit': 1,
            '$order': 'report_date_as_yyyy_mm_dd DESC',
            '$select': 'report_date_as_yyyy_mm_dd'
          },
          timeout: 10000
        });
        cftcLatestDate = cftcResponse.data[0]?.report_date_as_yyyy_mm_dd?.split('T')[0];
      } catch {
        // Ignore CFTC API errors
      }

      const ourLatest = latestDate.rows[0]?.latest;
      const isUpToDate = cftcLatestDate && ourLatest &&
        new Date(ourLatest).toISOString().split('T')[0] === cftcLatestDate;

      return {
        totalReports: parseInt(totalCount.rows[0].count),
        dateRange: {
          earliest: dateRange.rows[0]?.earliest,
          latest: dateRange.rows[0]?.latest
        },
        cftcLatestAvailable: cftcLatestDate,
        isUpToDate,
        markets: marketCounts.rows
      };

    } catch (error) {
      logger.error({ error }, 'Failed to get data status');
      throw error;
    }
  }
}
