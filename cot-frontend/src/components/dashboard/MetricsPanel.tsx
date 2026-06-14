import React from 'react';
import { ArrowDown, ArrowUp, BarChart3, Calendar, TrendingDown, TrendingUp } from 'lucide-react';
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

  // Calculate changes from previous report
  const prevCommercialNet = previousData ? previousData.commercial_long - previousData.commercial_short : 0;
  const prevNonCommercialNet = previousData ? previousData.non_commercial_long - previousData.non_commercial_short : 0;
  const prevOpenInterest = previousData?.open_interest || 0;

  const commercialNetChange = previousData ? commercialNet - prevCommercialNet : 0;
  const nonCommercialNetChange = previousData ? nonCommercialNet - prevNonCommercialNet : 0;
  const openInterestChange = previousData ? data.open_interest - prevOpenInterest : 0;

  const commercialLongPct = (data.commercial_long / data.open_interest) * 100;
  const commercialShortPct = (data.commercial_short / data.open_interest) * 100;
  const nonCommercialLongPct =
    (data.non_commercial_long / data.open_interest) * 100;
  const nonCommercialShortPct =
    (data.non_commercial_short / data.open_interest) * 100;

  const MetricCard = ({
    label,
    value,
    subValue,
    change,
    color,
    icon,
  }: {
    label: string;
    value: string;
    subValue?: string;
    change?: number;
    color?: string;
    icon?: React.ReactNode;
  }) => (
    <div className="group relative p-3 sm:p-5 rounded-lg sm:rounded-xl bg-card-muted border border-subtle-border hover:border-primary transition-colors duration-200">
      {icon && (
        <div className="hidden sm:block absolute top-4 right-4 text-muted-foreground opacity-30 group-hover:opacity-50 transition-opacity">
          {icon}
        </div>
      )}
      <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
        {label}
      </div>
      <div className={`text-xl sm:text-3xl font-bold ${color || 'text-foreground'}`}>
        {value}
      </div>
      {change !== undefined && change !== 0 && (
        <div className={`text-[10px] sm:text-sm mt-1 font-semibold flex items-center gap-1 ${
          change > 0 ? 'text-chart-1' : 'text-chart-2'
        }`}>
          {change > 0 ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
          {formatNumber(Math.abs(change))}
          <span className="hidden sm:inline">from last week</span>
        </div>
      )}
      {subValue && (
        <div className="text-[10px] sm:text-xs mt-1 sm:mt-2 font-medium text-muted-foreground">
          {subValue}
        </div>
      )}
    </div>
  );

  return (
    <div className="rounded-xl border border-subtle-border bg-card shadow-gem p-3 sm:p-6 h-fit lg:sticky lg:top-6">
      <h3 className="text-base sm:text-2xl font-bold mb-3 sm:mb-6 text-foreground">
        Latest Report
      </h3>

      <div className="space-y-2 sm:space-y-4">
        <MetricCard
          label="Report Date"
          value={formatDate(data.report_date)}
          icon={<Calendar className="h-8 w-8" />}
        />

        <MetricCard
          label="Open Interest"
          value={formatNumber(data.open_interest)}
          change={openInterestChange}
          subValue="Total contracts"
          icon={<BarChart3 className="h-8 w-8" />}
        />

        <MetricCard
          label="Commercial Net"
          value={formatSigned(commercialNet)}
          change={commercialNetChange}
          subValue={`${formatPercent((commercialNet / data.open_interest) * 100)} of OI`}
          color={commercialNet >= 0 ? 'text-chart-1' : 'text-chart-2'}
          icon={commercialNet >= 0 ? <TrendingUp className="h-8 w-8" /> : <TrendingDown className="h-8 w-8" />}
        />

        <MetricCard
          label="Speculative Net"
          value={formatSigned(nonCommercialNet)}
          change={nonCommercialNetChange}
          subValue={`${formatPercent((nonCommercialNet / data.open_interest) * 100)} of OI`}
          color={nonCommercialNet >= 0 ? 'text-chart-1' : 'text-chart-2'}
          icon={nonCommercialNet >= 0 ? <TrendingUp className="h-8 w-8" /> : <TrendingDown className="h-8 w-8" />}
        />

        <div className="pt-6 mt-6 border-t border-subtle-border">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            Detailed Positions
          </div>
          <div className="space-y-4">
            {/* Commercial Positions */}
            <div className="bg-card-muted border border-subtle-border p-3 sm:p-4 rounded-xl">
              <div className="text-xs font-semibold text-muted-foreground mb-2">COMMERCIAL</div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">Long</div>
                  <div className="text-base sm:text-lg font-bold text-chart-1">
                    {formatNumber(data.commercial_long)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatPercent(commercialLongPct)} of OI
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Short</div>
                  <div className="text-base sm:text-lg font-bold text-chart-2">
                    {formatNumber(data.commercial_short)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatPercent(commercialShortPct)} of OI
                  </div>
                </div>
              </div>
            </div>

            {/* Speculative Positions */}
            <div className="bg-card-muted border border-subtle-border p-3 sm:p-4 rounded-xl">
              <div className="text-xs font-semibold text-muted-foreground mb-2">SPECULATIVE</div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">Long</div>
                  <div className="text-base sm:text-lg font-bold text-chart-1">
                    {formatNumber(data.non_commercial_long)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatPercent(nonCommercialLongPct)} of OI
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Short</div>
                  <div className="text-base sm:text-lg font-bold text-chart-2">
                    {formatNumber(data.non_commercial_short)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatPercent(nonCommercialShortPct)} of OI
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
