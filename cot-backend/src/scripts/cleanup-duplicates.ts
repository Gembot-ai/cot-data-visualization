import { pool } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Clean up duplicate CoT reports and add unique constraint
 * Keep the report with highest ID (most recently inserted)
 */
async function cleanupDuplicates() {
  try {
    logger.info('Starting duplicate cleanup...');

    // Step 1: Delete duplicates, keeping only the record with highest ID
    const deleteResult = await pool.query(`
      DELETE FROM cot_reports
      WHERE id NOT IN (
        SELECT MAX(id)
        FROM cot_reports
        WHERE source = 'CFTC_API'
        GROUP BY market_id, report_date, source
      )
      AND source = 'CFTC_API'
    `);

    logger.info({ deletedCount: deleteResult.rowCount }, 'Deleted duplicate reports');

    // Step 2: Add unique constraint
    logger.info('Adding unique constraint...');
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_cot_unique_report
      ON cot_reports (market_id, report_date, source);
    `);

    logger.info('✅ Cleanup completed successfully!');

    // Step 3: Show summary
    const summary = await pool.query(`
      SELECT COUNT(*) as total_reports,
             COUNT(DISTINCT market_id) as markets,
             MIN(report_date) as earliest_date,
             MAX(report_date) as latest_date
      FROM cot_reports
      WHERE source = 'CFTC_API'
    `);

    logger.info('📊 Summary after cleanup:', summary.rows[0]);

    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Failed to cleanup duplicates');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

cleanupDuplicates();
