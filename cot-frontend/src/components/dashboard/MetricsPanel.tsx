import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import type { CotData } from '../../api/types';
import { formatDate, formatNumber, formatPercent, formatSigned } from '../../lib/format';

interface MetricsPanelProps {
  data: CotData;
  previousData?: CotData;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  data,
  previousData,
}) => {
  const commercialNet = data.commercial_long - data.commercial_short;
  const nonCommercialNet = data.non_commercial_long - data.non_commercial_short;

  // Week-over-week changes
  const prevCommercialNet = previousData ? previousData.commercial_long - previousData.commercial_short : 0;
  const prevNonCommercialNet = previousData ? previousData.non_commercial_long - previousData.non_commercial_short : 0;
  const prevOpenInterest = previousData?.open_interest || 0;

  const commercialNetChange = previousData ? commercialNet - prevCommercialNet : 0;
  const nonCommercialNetChange = previousData ? nonCommercialNet - prevNonCommercialNet : 0;
  const openInterestChange = previousData ? data.open_interest - prevOpenInterest : 0;

  const commercialLongPct = (data.commercial_long / data.open_interest) * 100;
  const commercialShortPct = (data.commercial_short / data.open_interest) * 100;
  const nonCommercialLongPct = (data.non_commercial_long / data.open_interest) * 100;
  const nonCommercialShortPct = (data.non_commercial_short / data.open_interest) * 100;

  // Small inline week-over-week change indicator.
  const Change = ({ value }: { value: number }) =>
    value === 0 ? null : (
      <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${value > 0 ? 'text-chart-1' : 'text-chart-2'}`}>
        {value > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
        {formatNumber(Math.abs(value))}
      </span>
    );

  // Compact net-position tile (Commercial / Speculative).
  const NetCard = ({ label, value, pct, change }: { label: string; value: number; pct: number; change: number }) => (
    <div className="rounded-lg bg-card-muted border border-subtle-border p-3">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`text-xl font-bold leading-tight ${value >= 0 ? 'text-chart-1' : 'text-chart-2'}`}>
        {formatSigned(value)}
      </div>
      <div className="mt-1 flex items-center justify-between gap-1">
        <span className="text-[11px] text-muted-foreground">{formatPercent(pct)} of OI</span>
        <Change value={change} />
      </div>
    </div>
  );

  // Dense long/short row for the detailed breakdown.
  const PositionRow = ({ label, long, longPct, short, shortPct }: {
    label: string; long: number; longPct: number; short: number; shortPct: number;
  }) => (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-subtle-border last:border-0">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 grid grid-cols-2 gap-3 text-right">
        <div>
          <div className="text-sm font-bold text-chart-1 leading-tight">{formatNumber(long)}</div>
          <div className="text-[10px] text-muted-foreground">Long {formatPercent(longPct)}</div>
        </div>
        <div>
          <div className="text-sm font-bold text-chart-2 leading-tight">{formatNumber(short)}</div>
          <div className="text-[10px] text-muted-foreground">Short {formatPercent(shortPct)}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="rounded-xl border border-subtle-border bg-card shadow-gem p-4 sm:p-5 h-fit lg:sticky lg:top-20">
      {/* Header with inline report date */}
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <h3 className="text-lg font-bold text-foreground">Latest Report</h3>
        <span className="text-xs font-medium text-muted-foreground">{formatDate(data.report_date)}</span>
      </div>

      {/* Open Interest — slim row */}
      <div className="flex items-center justify-between gap-2 rounded-lg bg-card-muted border border-subtle-border px-3 py-2 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Open Interest</span>
        <span className="flex items-center gap-2">
          <span className="text-base font-bold text-foreground">{formatNumber(data.open_interest)}</span>
          <Change value={openInterestChange} />
        </span>
      </div>

      {/* Net positions — two up */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <NetCard
          label="Commercial Net"
          value={commercialNet}
          pct={(commercialNet / data.open_interest) * 100}
          change={commercialNetChange}
        />
        <NetCard
          label="Speculative Net"
          value={nonCommercialNet}
          pct={(nonCommercialNet / data.open_interest) * 100}
          change={nonCommercialNetChange}
        />
      </div>

      {/* Detailed positions — dense rows */}
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
        Detailed Positions
      </div>
      <div>
        <PositionRow
          label="Commercial"
          long={data.commercial_long}
          longPct={commercialLongPct}
          short={data.commercial_short}
          shortPct={commercialShortPct}
        />
        <PositionRow
          label="Speculative"
          long={data.non_commercial_long}
          longPct={nonCommercialLongPct}
          short={data.non_commercial_short}
          shortPct={nonCommercialShortPct}
        />
      </div>
    </div>
  );
};
