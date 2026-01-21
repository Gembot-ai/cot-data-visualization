export interface Market {
  id: number;
  symbol: string;
  name: string;
  category: string;
  exchange?: string;
  description?: string;
  contract_unit?: string;
  tick_size?: number;
  cftc_code?: string;  // Official CFTC contract market code for reliable matching
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CotReport {
  id?: number;
  market_id: number;
  report_date: Date;
  publish_date: Date;

  // Commercial traders
  commercial_long: number;
  commercial_short: number;
  commercial_spreading?: number;
  num_commercial_long?: number;
  num_commercial_short?: number;

  // Non-commercial traders
  non_commercial_long: number;
  non_commercial_short: number;
  non_commercial_spreading?: number;
  num_non_commercial_long?: number;
  num_non_commercial_short?: number;

  // Non-reportable
  non_reportable_long?: number;
  non_reportable_short?: number;
  num_non_reportable_long?: number;
  num_non_reportable_short?: number;

  // Changes
  commercial_long_change?: number;
  commercial_short_change?: number;
  non_commercial_long_change?: number;
  non_commercial_short_change?: number;

  // Open interest
  open_interest: number;

  // Disaggregated data
  swap_dealers_long?: number;
  swap_dealers_short?: number;
  managed_money_long?: number;
  managed_money_short?: number;
  other_reportable_long?: number;
  other_reportable_short?: number;

  // Metadata
  source?: string;
  data_quality_score?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface CotMetrics {
  id?: number;
  cot_report_id: number;

  // Net positions
  commercial_net: number;
  non_commercial_net: number;

  // Percentages
  commercial_long_pct: number;
  commercial_short_pct: number;
  non_commercial_long_pct: number;
  non_commercial_short_pct: number;
  non_reportable_pct?: number;

  // Sentiment
  commercial_sentiment: number;

  // 52-week extremes
  commercial_net_52w_high?: number;
  commercial_net_52w_low?: number;
  percentile_rank?: number;

  // Concentration
  top_4_long_pct?: number;
  top_4_short_pct?: number;

  created_at?: Date;
}

export interface CotTrend {
  id?: number;
  market_id: number;
  week_ending: Date;

  // Moving averages
  ma_4week_commercial_net?: number;
  ma_13week_commercial_net?: number;
  ma_26week_commercial_net?: number;

  // Rate of change
  roc_4week?: number;
  roc_13week?: number;

  // Extreme flags
  is_extreme_long: boolean;
  is_extreme_short: boolean;

  created_at?: Date;
}

export interface DataFetch {
  id?: number;
  fetch_type: string;
  source: string;
  market_symbols?: string;
  records_fetched: number;
  records_inserted: number;
  records_updated: number;
  fetch_duration_ms: number;
  success: boolean;
  error_message?: string;
  created_at?: Date;
}
