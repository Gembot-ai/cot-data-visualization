import { pool } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Seed sample CoT data for demonstration
 * Creates 52 weeks of sample data for key markets
 */
async function seedSampleData() {
  try {
    logger.info('Seeding sample CoT data...');

    // Get market IDs
    const marketsResult = await pool.query(
      `SELECT id, symbol FROM markets WHERE symbol IN ('GC', 'CL', 'ES', 'NQ', 'BTC', 'ETH', 'SI')`
    );

    if (marketsResult.rows.length === 0) {
      logger.error('No markets found. Run server first to initialize markets.');
      process.exit(1);
    }

    const markets = marketsResult.rows;
    logger.info({ count: markets.length }, 'Markets found');

    // Generate 52 weeks of data
    const weeksToGenerate = 52;
    const today = new Date();

    for (const market of markets) {
      logger.info({ symbol: market.symbol }, 'Generating data for market');

      for (let week = 0; week < weeksToGenerate; week++) {
        const reportDate = new Date(today);
        reportDate.setDate(reportDate.getDate() - (week * 7));

        // Set to Tuesday
        const dayOfWeek = reportDate.getDay();
        const daysToTuesday = (dayOfWeek + 5) % 7;
        reportDate.setDate(reportDate.getDate() - daysToTuesday);

        const publishDate = new Date(reportDate);
        publishDate.setDate(publishDate.getDate() + 3); // Friday

        // Generate realistic-looking sample data
        const baseOI = 500000 + Math.random() * 200000;
        const commercialLong = Math.floor(baseOI * (0.3 + Math.random() * 0.1));
        const commercialShort = Math.floor(baseOI * (0.35 + Math.random() * 0.1));
        const nonCommercialLong = Math.floor(baseOI * (0.25 + Math.random() * 0.15));
        const nonCommercialShort = Math.floor(baseOI * (0.20 + Math.random() * 0.15));
        const nonReportableLong = Math.floor(baseOI * 0.05);

        await pool.query(
          `INSERT INTO cot_reports (
            market_id, report_date, publish_date,
            commercial_long, commercial_short,
            non_commercial_long, non_commercial_short,
            non_reportable_long,
            open_interest,
            source
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT DO NOTHING`,
          [
            market.id,
            reportDate,
            publishDate,
            commercialLong,
            commercialShort,
            nonCommercialLong,
            nonCommercialShort,
            nonReportableLong,
            Math.floor(baseOI),
            'SAMPLE_DATA'
          ]
        );
      }
    }

    logger.info('Sample data seeded successfully');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Failed to seed sample data');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedSampleData();
