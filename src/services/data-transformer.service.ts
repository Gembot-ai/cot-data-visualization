import { CotReport, CotMetrics } from '../types/cot.types';

export class DataTransformerService {
  /**
   * Transform raw CFTC API response to internal schema
   */
  transformCFTCResponse(raw: any, marketId: number): CotReport {
    return {
      market_id: marketId,
      report_date: new Date(raw.report_date_as_yyyy_mm_dd),
      publish_date: this.getPublishDate(new Date(raw.report_date_as_yyyy_mm_dd)),

      commercial_long: raw.comm_positions_long_all || 0,
      commercial_short: raw.comm_positions_short_all || 0,
      commercial_spreading: raw.comm_positions_spread_all,

      non_commercial_long: raw.noncomm_positions_long_all || 0,
      non_commercial_short: raw.noncomm_positions_short_all || 0,
      non_commercial_spreading: raw.noncomm_positions_spread_all,

      non_reportable_long: this.calculateNonReportable(
        raw.open_interest_all,
        raw.comm_positions_long_all + raw.noncomm_positions_long_all
      ),

      open_interest: raw.open_interest_all || 0,

      commercial_long_change: raw.change_in_comm_long_all,
      commercial_short_change: raw.change_in_comm_short_all,
      non_commercial_long_change: raw.change_in_noncomm_long_all,
      non_commercial_short_change: raw.change_in_noncomm_short_all,

      source: 'CFTC_API'
    };
  }

  /**
   * Calculate derived metrics (net positions, percentages, etc.)
   */
  calculateMetrics(report: CotReport): CotMetrics {
    const oi = report.open_interest;

    const commercialNet = report.commercial_long - report.commercial_short;
    const nonCommercialNet = report.non_commercial_long - report.non_commercial_short;

    return {
      cot_report_id: report.id!,

      commercial_net: commercialNet,
      non_commercial_net: nonCommercialNet,

      commercial_long_pct: (report.commercial_long / oi) * 100,
      commercial_short_pct: (report.commercial_short / oi) * 100,

      non_commercial_long_pct: (report.non_commercial_long / oi) * 100,
      non_commercial_short_pct: (report.non_commercial_short / oi) * 100,

      non_reportable_pct: report.non_reportable_long
        ? (report.non_reportable_long / oi) * 100
        : 0,

      // Sentiment from -100 (all short) to +100 (all long)
      commercial_sentiment: this.calculateSentiment(commercialNet, oi),

      // These would be populated from historical data
      top_4_long_pct: 0,
      top_4_short_pct: 0,
    };
  }

  /**
   * Calculate 4-week, 13-week, and 26-week moving averages
   */
  calculateMovingAverages(
    reports: CotReport[],
    period: 4 | 13 | 26 = 4
  ): (number | null)[] {
    return reports.map((report, index) => {
      if (index < period - 1) return null; // Not enough data

      const slice = reports.slice(index - period + 1, index + 1);
      const sum = slice.reduce((acc, r) => {
        const net = r.commercial_long - r.commercial_short;
        return acc + net;
      }, 0);

      return Math.round(sum / period);
    });
  }

  /**
   * Detect extreme positions vs 52-week range
   */
  detectExtremes(
    currentReport: CotReport,
    historicalReports: CotReport[],
    percentileThreshold: number = 90
  ): { isExtreme: boolean; percentile: number; isLong: boolean; isShort: boolean } {
    const nets = historicalReports.map(r => r.commercial_long - r.commercial_short);
    const currentNet = currentReport.commercial_long - currentReport.commercial_short;

    const min = Math.min(...nets);
    const max = Math.max(...nets);

    const percentile = ((currentNet - min) / (max - min)) * 100;
    const isExtremeLong = percentile >= percentileThreshold;
    const isExtremeShort = percentile <= (100 - percentileThreshold);

    return {
      isExtreme: isExtremeLong || isExtremeShort,
      percentile: Math.round(percentile),
      isLong: isExtremeLong,
      isShort: isExtremeShort
    };
  }

  /**
   * Calculate rate of change over period
   */
  calculateRateOfChange(
    current: number,
    previous: number
  ): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Get publish date (Friday) from report date (Tuesday)
   */
  private getPublishDate(reportDate: Date): Date {
    const publish = new Date(reportDate);
    // Report is Tuesday, publish is Friday (3 days later)
    publish.setDate(publish.getDate() + 3);
    return publish;
  }

  private calculateNonReportable(
    totalOI: number,
    reportedLong: number
  ): number {
    // Simplified calculation
    return Math.max(0, totalOI - reportedLong);
  }

  private calculateSentiment(
    commercialNet: number,
    openInterest: number
  ): number {
    if (openInterest === 0) return 0;
    // Normalize to -100 to +100 scale
    const normalized = (commercialNet / openInterest) * 200;
    return Math.max(-100, Math.min(100, Math.round(normalized)));
  }
}
