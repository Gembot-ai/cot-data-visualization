import { getEodTicker, getEodMapping } from '../config/eod-symbol-map';
import { logger } from '../utils/logger';

export interface PricePoint {
  date: string;      // YYYY-MM-DD
  close: number;
  adjusted_close: number;
}

const EOD_API_BASE = 'https://eodhd.com/api';

export class EodPriceService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.EOD_API_KEY || '';
    if (!this.apiKey) {
      logger.warn('EOD_API_KEY not set - price data will be unavailable');
    }
  }

  /**
   * Fetch daily price data from EODHD for a given market symbol.
   * Returns prices aligned to COT report dates when reportDates are provided.
   */
  async getPrices(
    marketSymbol: string,
    from?: string,
    to?: string,
    reportDates?: string[]
  ): Promise<{ ticker: string; name: string; prices: PricePoint[] }> {
    const mapping = getEodMapping(marketSymbol);
    if (!mapping) {
      throw new Error(`No EOD ticker mapping for symbol: ${marketSymbol}`);
    }
    const { ticker, name } = mapping;

    if (!this.apiKey) {
      throw new Error('EOD_API_KEY not configured');
    }

    const url = new URL(`${EOD_API_BASE}/eod/${ticker}`);
    url.searchParams.set('api_token', this.apiKey);
    url.searchParams.set('fmt', 'json');
    url.searchParams.set('order', 'a'); // ascending by date
    if (from) url.searchParams.set('from', from);
    if (to) url.searchParams.set('to', to);

    logger.info({ ticker, from, to }, 'Fetching EOD price data');

    const response = await fetch(url.toString());
    if (!response.ok) {
      const text = await response.text();
      logger.error({ status: response.status, body: text, ticker }, 'EOD API error');
      throw new Error(`EOD API returned ${response.status}: ${text}`);
    }

    const rawData = (await response.json()) as Array<{
      date: string;
      open: number;
      high: number;
      low: number;
      close: number;
      adjusted_close: number;
      volume: number;
    }>;

    // If reportDates provided, align prices to those dates
    // For each report date, find the closest trading day on or before
    if (reportDates && reportDates.length > 0) {
      const aligned = this.alignToReportDates(rawData, reportDates);
      return { ticker, name, prices: aligned };
    }

    return {
      ticker,
      name,
      prices: rawData.map(d => ({
        date: d.date,
        close: d.close,
        adjusted_close: d.adjusted_close,
      })),
    };
  }

  /**
   * For each COT report date, find the closest trading day price
   * (same day or most recent trading day before).
   */
  private alignToReportDates(
    priceData: Array<{ date: string; close: number; adjusted_close: number }>,
    reportDates: string[]
  ): PricePoint[] {
    if (priceData.length === 0) return [];

    const result: PricePoint[] = [];
    let priceIdx = 0;

    // Both arrays should be ascending by date
    const sortedReportDates = [...reportDates].sort();

    for (const reportDate of sortedReportDates) {
      // Advance price index to the last price on or before this report date
      while (
        priceIdx < priceData.length - 1 &&
        priceData[priceIdx + 1].date <= reportDate
      ) {
        priceIdx++;
      }

      // Only include if we have a price that's not too far from the report date
      if (priceData[priceIdx].date <= reportDate) {
        result.push({
          date: reportDate,
          close: priceData[priceIdx].close,
          adjusted_close: priceData[priceIdx].adjusted_close,
        });
      }
    }

    return result;
  }
}
