import { pool } from '../config/database';
import { logger } from '../utils/logger';
import { fetchAllCotData } from './fetch-all-cot-data';

/**
 * Weekly update script for Railway Cron
 * Fetches the latest CoT data from CFTC API
 *
 * Railway Cron Setup:
 * 1. In Railway dashboard, go to your service
 * 2. Click "New" → "Cron Job"
 * 3. Schedule: 0 20 * * FRI (Every Friday at 8 PM UTC)
 * 4. Command: npm run weekly-update
 */

async function weeklyUpdate() {
  try {
    logger.info('🕐 Starting weekly CoT data update...');

    // Check current data
    const currentData = await pool.query(`
      SELECT
        MAX(report_date) as latest_date,
        COUNT(*) as total_reports
      FROM cot_reports
    `);

    logger.info('Current data:', currentData.rows[0]);

    // Fetch latest data (the fetch script handles duplicates automatically)
    await fetchAllCotData();

    // Check updated data
    const updatedData = await pool.query(`
      SELECT
        MAX(report_date) as latest_date,
        COUNT(*) as total_reports
      FROM cot_reports
    `);

    logger.info('Updated data:', updatedData.rows[0]);

    const newReports = parseInt(updatedData.rows[0].total_reports) - parseInt(currentData.rows[0].total_reports);
    logger.info({ newReports }, `✅ Weekly update completed! Added ${newReports} new reports.`);

  } catch (error) {
    logger.error({ error }, '❌ Weekly update failed');
    throw error;
  } finally {
    await pool.end();
  }
}

weeklyUpdate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
