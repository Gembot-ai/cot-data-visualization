import { pool } from '../config/database';
import { logger } from '../utils/logger';
import { MarketsRepository } from '../database/repositories/markets.repo';
import { MARKETS } from '../utils/constants';

/**
 * Railway initialization script
 * Runs automatically on first deployment to set up database
 *
 * This script:
 * 1. Creates database schema (tables, indexes, hypertables)
 * 2. Initializes markets data
 * 3. Optionally fetches initial CoT data
 */

async function railwayInit() {
  try {
    logger.info('🚀 Starting Railway initialization...');

    // 1. Create schema
    logger.info('📊 Creating database schema...');

    const schemaSQL = `
      -- Create markets table
      CREATE TABLE IF NOT EXISTS markets (
        id SERIAL PRIMARY KEY,
        symbol VARCHAR(10) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        exchange VARCHAR(100),
        description TEXT,
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create cot_reports table
      CREATE TABLE IF NOT EXISTS cot_reports (
        id SERIAL PRIMARY KEY,
        market_id INTEGER REFERENCES markets(id) ON DELETE CASCADE,
        report_date DATE NOT NULL,
        publish_date DATE NOT NULL,
        commercial_long BIGINT DEFAULT 0,
        commercial_short BIGINT DEFAULT 0,
        non_commercial_long BIGINT DEFAULT 0,
        non_commercial_short BIGINT DEFAULT 0,
        non_reportable_long BIGINT DEFAULT 0,
        non_reportable_short BIGINT DEFAULT 0,
        open_interest BIGINT DEFAULT 0,
        source VARCHAR(50) DEFAULT 'CFTC_API',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(market_id, report_date, source)
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_cot_market_date ON cot_reports(market_id, report_date DESC);
      CREATE INDEX IF NOT EXISTS idx_cot_publish_date ON cot_reports(publish_date DESC);
      CREATE INDEX IF NOT EXISTS idx_cot_source ON cot_reports(source);
      CREATE INDEX IF NOT EXISTS idx_markets_symbol ON markets(symbol);
      CREATE INDEX IF NOT EXISTS idx_markets_category ON markets(category);

      -- Try to create TimescaleDB hypertable (fails gracefully if extension not available)
      DO $$
      BEGIN
        -- Check if TimescaleDB extension exists
        IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'timescaledb') THEN
          -- Create extension if not exists
          CREATE EXTENSION IF NOT EXISTS timescaledb;

          -- Convert to hypertable if not already
          PERFORM create_hypertable('cot_reports', 'publish_date',
            chunk_time_interval => INTERVAL '1 month',
            if_not_exists => TRUE
          );

          RAISE NOTICE 'TimescaleDB hypertable created successfully';
        ELSE
          RAISE NOTICE 'TimescaleDB not available, using regular PostgreSQL table';
        END IF;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE NOTICE 'Could not create TimescaleDB hypertable, using regular table: %', SQLERRM;
      END$$;
    `;

    await pool.query(schemaSQL);
    logger.info('✅ Database schema created');

    // 2. Initialize markets
    const marketsRepo = new MarketsRepository();
    const existingMarkets = await marketsRepo.findAll();

    if (existingMarkets.length === 0) {
      logger.info('📈 Initializing markets...');
      const marketsData = Object.entries(MARKETS).map(([symbol, data]) => ({
        symbol,
        name: data.name,
        category: data.category,
        exchange: data.exchange,
        description: `${data.name} futures contract`,
        active: true
      }));

      await marketsRepo.initializeMarkets(marketsData);
      logger.info({ count: marketsData.length }, '✅ Markets initialized');
    } else {
      logger.info({ count: existingMarkets.length }, '✅ Markets already initialized');
    }

    // 3. Check if we should fetch initial data
    const reportCount = await pool.query('SELECT COUNT(*) FROM cot_reports');
    const count = parseInt(reportCount.rows[0].count);

    if (count === 0) {
      logger.info('📥 No CoT data found. Starting automatic data fetch from CFTC API...');
      logger.info('⏱️  This will take approximately 10-15 minutes. Please be patient.');

      // Don't close pool - fetchAllCotData needs it
      // Import and run the fetch script
      const { fetchAllCotData } = await import('./fetch-all-cot-data');
      await fetchAllCotData();

      logger.info('✅ Initial data fetch completed!');
    } else {
      logger.info({ reports: count }, '✅ CoT data already loaded');
    }

    logger.info('✨ Railway initialization complete!');
  } catch (error) {
    logger.error({ error }, '❌ Railway initialization failed');
    throw error;
  } finally {
    await pool.end();
  }
}

railwayInit();
