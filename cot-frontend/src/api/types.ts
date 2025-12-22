export interface Market {
  symbol: string;
  name: string;
  category: string;
  exchange?: string;
}

export interface CotData {
  id: number;
  market_id: number;
  report_date: string;
  publish_date: string;
  commercial_long: number;
  commercial_short: number;
  non_commercial_long: number;
  non_commercial_short: number;
  non_reportable_long?: number;
  non_reportable_short?: number;
  open_interest: number;
  commercial_long_change?: number;
  commercial_short_change?: number;
  non_commercial_long_change?: number;
  non_commercial_short_change?: number;
}

export interface CotResponse {
  market: Market;
  report: CotData;
}

export interface CotHistoryResponse {
  market: Market;
  reports: CotData[];
  count: number;
}

export interface MarketsResponse {
  markets: Market[];
  count: number;
}

export interface CotBatchResponse {
  results: Array<{
    market: Market;
    report: CotData;
  }>;
  count: number;
}
