import { pool } from '../config/database';
import { logger } from '../utils/logger';
import { fetchAllCotData } from './fetch-all-cot-data';

/**
 * Clear all existing COT data and re-fetch from CFTC API
 * This ensures data integrity by starting fresh with correct contract code matching
 *
 * Usage: npm run refetch-all
 *
 * WARNING: This will delete all existing COT report data!
 */

async function refetchAllCotData() {
  try {
    logger.info('🗑️  Starting complete data refresh...');

    // Confirm action
    console.log('\n' + '='.repeat(60));
    console.log('WARNING: This will delete ALL existing COT report data');
    console.log('and re-fetch everything from the CFTC API.');
    console.log('='.repeat(60) + '\n');

    // Get current data count
    const currentCount = await pool.query(`
      SELECT COUNT(*) as count FROM cot_reports
    `);
    logger.info({ currentRecords: currentCount.rows[0].count }, 'Current records in database');

    // Delete all existing COT data
    logger.info('🗑️  Deleting all existing COT reports...');
    const deleteResult = await pool.query(`
      DELETE FROM cot_reports WHERE source = 'CFTC_API'
    `);
    logger.info({ deletedRecords: deleteResult.rowCount }, 'Deleted existing records');

    // Also clear any related metrics
    logger.info('🗑️  Clearing related metrics...');
    await pool.query(`DELETE FROM cot_metrics`);
    await pool.query(`DELETE FROM cot_trends`);

    // Reset the start date to fetch all historical data
    logger.info('📥 Starting fresh data fetch from CFTC API...');
    logger.info('This may take several minutes depending on the amount of data...');

    // Fetch all data fresh
    await fetchAllCotData();

    // Verify new data
    const newCount = await pool.query(`
      SELECT COUNT(*) as count FROM cot_reports WHERE source = 'CFTC_API'
    `);

    const marketSummary = await pool.query(`
      SELECT m.symbol, COUNT(*) as count,
             MIN(r.report_date) as earliest,
             MAX(r.report_date) as latest
      FROM cot_reports r
      JOIN markets m ON m.id = r.market_id
      WHERE r.source = 'CFTC_API'
      GROUP BY m.symbol
      ORDER BY m.symbol
    `);

    console.log('\n' + '='.repeat(60));
    console.log('REFETCH COMPLETE');
    console.log('='.repeat(60));
    console.log(`Total records: ${newCount.rows[0].count}`);
    console.log('\nRecords by market:');
    for (const row of marketSummary.rows) {
      console.log(`  ${row.symbol}: ${row.count} reports (${row.earliest} to ${row.latest})`);
    }
    console.log('='.repeat(60) + '\n');

    logger.info('✅ Data refresh completed successfully!');

  } catch (error) {
    logger.error({ error }, 'Refetch failed');
    throw error;
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  refetchAllCotData()
    .then(() => {
      process.exit(0);
    })
    .catch(() => {
      process.exit(1);
    });
}

export { refetchAllCotData };
