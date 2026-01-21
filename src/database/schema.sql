-- Enable TimescaleDB extension for time-series optimization
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Markets dimension table
CREATE TABLE IF NOT EXISTS markets (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  exchange VARCHAR(50),
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add contract metadata columns if they don't exist (migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'markets' AND column_name = 'contract_unit'
  ) THEN
    ALTER TABLE markets ADD COLUMN contract_unit VARCHAR(100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'markets' AND column_name = 'tick_size'
  ) THEN
    ALTER TABLE markets ADD COLUMN tick_size VARCHAR(100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'markets' AND column_name = 'cftc_code'
  ) THEN
    ALTER TABLE markets ADD COLUMN cftc_code VARCHAR(20);
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_markets_symbol ON markets(symbol);
CREATE INDEX IF NOT EXISTS idx_markets_category ON markets(category);

-- Main CoT reports table (time-series, hypertable)
CREATE TABLE IF NOT EXISTS cot_reports (
  id BIGSERIAL NOT NULL,
  market_id INTEGER NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  publish_date DATE NOT NULL,

  -- Commercial traders (hedgers)
  commercial_long BIGINT NOT NULL,
  commercial_short BIGINT NOT NULL,
  commercial_spreading BIGINT,
  num_commercial_long INT,
  num_commercial_short INT,

  -- Non-Commercial traders (speculators)
  non_commercial_long BIGINT NOT NULL,
  non_commercial_short BIGINT NOT NULL,
  non_commercial_spreading BIGINT,
  num_non_commercial_long INT,
  num_non_commercial_short INT,

  -- Non-Reportable (retail)
  non_reportable_long BIGINT,
  non_reportable_short BIGINT,
  num_non_reportable_long INT,
  num_non_reportable_short INT,

  -- Week-over-week changes
  commercial_long_change BIGINT,
  commercial_short_change BIGINT,
  non_commercial_long_change BIGINT,
  non_commercial_short_change BIGINT,

  -- Open interest
  open_interest BIGINT NOT NULL,

  -- Disaggregated data (optional)
  swap_dealers_long BIGINT,
  swap_dealers_short BIGINT,
  managed_money_long BIGINT,
  managed_money_short BIGINT,
  other_reportable_long BIGINT,
  other_reportable_short BIGINT,

  -- Metadata
  source VARCHAR(50) DEFAULT 'CFTC_API',
  data_quality_score DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id, publish_date)
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('cot_reports', 'publish_date', if_not_exists => TRUE);

-- Unique constraint per market per week
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_market_week'
  ) THEN
    ALTER TABLE cot_reports ADD CONSTRAINT unique_market_week
      UNIQUE (market_id, report_date);
  END IF;
END$$;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_cot_market_date ON cot_reports (market_id, report_date DESC);
CREATE INDEX IF NOT EXISTS idx_cot_publish_date ON cot_reports (publish_date DESC);

-- Computed metrics table
CREATE TABLE IF NOT EXISTS cot_metrics (
  id BIGSERIAL PRIMARY KEY,
  cot_report_id BIGINT NOT NULL UNIQUE,

  -- Net positions
  commercial_net BIGINT,
  non_commercial_net BIGINT,

  -- Percentages of OI
  commercial_long_pct DECIMAL(5,2),
  commercial_short_pct DECIMAL(5,2),
  non_commercial_long_pct DECIMAL(5,2),
  non_commercial_short_pct DECIMAL(5,2),
  non_reportable_pct DECIMAL(5,2),

  -- Commercial sentiment (-100 to +100)
  commercial_sentiment INT,

  -- 52-week extremes
  commercial_net_52w_high BIGINT,
  commercial_net_52w_low BIGINT,
  percentile_rank INT,

  -- Concentration ratios
  top_4_long_pct DECIMAL(5,2),
  top_4_short_pct DECIMAL(5,2),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_metrics_report ON cot_metrics(cot_report_id);

-- Trends and moving averages
CREATE TABLE IF NOT EXISTS cot_trends (
  id BIGSERIAL NOT NULL,
  market_id INTEGER NOT NULL REFERENCES markets(id),
  week_ending DATE NOT NULL,

  -- Moving averages
  ma_4week_commercial_net BIGINT,
  ma_13week_commercial_net BIGINT,
  ma_26week_commercial_net BIGINT,

  -- Rate of change
  roc_4week DECIMAL(6,2),
  roc_13week DECIMAL(6,2),

  -- Extreme flags
  is_extreme_long BOOLEAN DEFAULT false,
  is_extreme_short BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id, week_ending)
);

SELECT create_hypertable('cot_trends', 'week_ending', if_not_exists => TRUE);
CREATE INDEX IF NOT EXISTS idx_trends_market_date ON cot_trends (market_id, week_ending DESC);

-- API audit log
CREATE TABLE IF NOT EXISTS data_fetches (
  id BIGSERIAL PRIMARY KEY,
  fetch_type VARCHAR(50),
  source VARCHAR(50) DEFAULT 'CFTC_API',
  market_symbols VARCHAR(255),
  records_fetched INT,
  records_inserted INT,
  records_updated INT,
  fetch_duration_ms INT,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_data_fetches_date ON data_fetches(created_at DESC);
