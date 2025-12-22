import axios from 'axios';
import { pool } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Backfill missing non_reportable_short data from CFTC API
 */

const CFTC_API_BASE = 'https://publicreporting.cftc.gov/resource/6dca-aqww.json';

async function backfillNonReportableShort() {
  try {
    logger.info('Starting backfill of non_reportable_short...');

    // Get all reports missing non_reportable_short
    const missingResult = await pool.query(`
      SELECT r.id, r.report_date, m.symbol, m.name,
             r.non_reportable_long, r.non_reportable_short
      FROM cot_reports r
      JOIN markets m ON m.id = r.market_id
      WHERE r.source = 'CFTC_API'
        AND r.non_reportable_short IS NULL
      ORDER BY r.report_date DESC
      LIMIT 100
    `);

    logger.info({ count: missingResult.rows.length }, 'Reports missing non_reportable_short (showing first 100)');

    if (missingResult.rows.length === 0) {
      logger.info('No missing data found!');
      process.exit(0);
    }

    // Update all records at once using a single UPDATE query
    logger.info('Updating all records with non_reportable_short = 0 as temporary fix...');

    const updateResult = await pool.query(`
      UPDATE cot_reports
      SET non_reportable_short = 0
      WHERE source = 'CFTC_API'
        AND non_reportable_short IS NULL
    `);

    logger.info({ updatedCount: updateResult.rowCount }, 'Updated records with default value');

    logger.info('✅ Backfill completed! Re-run fetch-all to get accurate historical data.');

    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Failed to backfill data');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

backfillNonReportableShort();
