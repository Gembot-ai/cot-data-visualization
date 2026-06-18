import React, { useMemo, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useCotData, useCotHistory, useAssetPrices } from '../hooks/useCotData';
import { StackedBarChart } from '../components/charts/StackedBarChart';
import { MetricsPanel } from '../components/dashboard/MetricsPanel';
import { MarketSelector } from '../components/dashboard/MarketSelector';
import { useTheme } from '../lib/theme';
import { formatDate, formatSigned } from '../lib/format';

export const DashboardPage: React.FC = () => {
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(['GC']);
  const { theme, toggleTheme } = useTheme();

  const selectedMarket = selectedMarkets[0] || 'GC';
  const latestQuery = useCotData(selectedMarket);
  const historyQuery = useCotHistory(selectedMarket);

  // Extract report dates for price alignment
  const reportDates = useMemo(() => {
    if (!historyQuery.data?.reports) return undefined;
    return historyQuery.data.reports.map((r) =>
      new Date(r.report_date).toISOString().split('T')[0]
    );
  }, [historyQuery.data]);

  const priceQuery = useAssetPrices(selectedMarket, reportDates);

  const ThemeToggle = () => (
    <button
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="inline-flex items-center justify-center h-10 w-10 rounded-md border border-subtle-border bg-card text-foreground hover:bg-muted/40 transition-colors flex-shrink-0"
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );

  if (latestQuery.isLoading || historyQuery.isLoading) {
    return (
      <div className="min-h-screen bg-surface text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="w-16 h-16 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
          </div>
          <div className="text-2xl font-bold mb-2">Loading CoT Data...</div>
          <div className="text-sm text-muted-foreground">
            Latest: {latestQuery.isLoading ? 'loading...' : 'done'} |
            History: {historyQuery.isLoading ? 'loading...' : 'done'}
          </div>
        </div>
      </div>
    );
  }

  if (latestQuery.isError || historyQuery.isError) {
    return (
      <div className="min-h-screen bg-surface text-foreground flex items-center justify-center">
        <div className="text-center rounded-xl border border-subtle-border bg-card p-8 max-w-md shadow-gem">
          <div className="text-2xl font-bold mb-2 text-destructive">Error loading data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-foreground safe-bottom">
      {/* Consolidated sticky top nav: brand + market selector + status + actions */}
      <header className="sticky top-0 z-30 border-b border-subtle-border bg-surface/90 backdrop-blur-lg safe-top">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-4 h-14 sm:h-16">
            {/* Brand */}
            <a
              href="https://eccuity.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
            >
              <img src="/images/eccuity-logo.svg" alt="eccuity" className="h-8 w-8 sm:h-9 sm:w-9" />
              <div className="hidden sm:block min-w-0">
                <h1 className="text-base lg:text-lg font-bold text-foreground leading-tight truncate">
                  Commitment of Traders
                </h1>
                <p className="hidden lg:block -mt-0.5 text-[11px] text-muted-foreground font-medium truncate">
                  See where retail, hedge funds and commercial hedgers are positioned.
                </p>
              </div>
            </a>

            {/* Market selector — the primary control, lives in the nav */}
            <div className="flex-1 min-w-0 max-w-md">
              <MarketSelector selectedMarkets={selectedMarkets} onChange={setSelectedMarkets} multiSelect={false} />
            </div>

            {/* Right cluster: status + actions */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {latestQuery.data && (
                <div className="hidden md:flex flex-col items-end leading-tight">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Updated</span>
                  <span className="text-xs font-bold text-foreground whitespace-nowrap">
                    {formatDate(latestQuery.data.report.report_date)}
                  </span>
                </div>
              )}
              <ThemeToggle />
              <a
                href="https://app.eccuity.com/register"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:inline-flex items-center bg-secondary hover:bg-secondary/90 text-secondary-foreground px-4 py-2 rounded-md text-sm font-semibold transition-colors whitespace-nowrap"
              >
                Try eccuity free
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-3 sm:py-6 pb-safe">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
          {/* Chart — top of the hierarchy on mobile, left column on desktop */}
          <div className="lg:col-span-2 order-1">
            {historyQuery.data && (
              <StackedBarChart
                data={historyQuery.data.reports}
                priceData={priceQuery.data?.prices}
                priceTicker={priceQuery.data?.ticker}
                priceName={priceQuery.data?.name}
              />
            )}
          </div>

          {/* Mobile-only quick metrics, directly under the chart */}
          <div className="sm:hidden order-2 grid grid-cols-2 gap-2">
            {latestQuery.data && (
              <>
                <div className="rounded-xl border border-subtle-border bg-card p-3">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Commercial Net</div>
                  <div className={`text-xl font-bold ${(latestQuery.data.report.commercial_long - latestQuery.data.report.commercial_short) >= 0 ? 'text-chart-1' : 'text-chart-2'}`}>
                    {formatSigned(latestQuery.data.report.commercial_long - latestQuery.data.report.commercial_short)}
                  </div>
                </div>
                <div className="rounded-xl border border-subtle-border bg-card p-3">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Speculative Net</div>
                  <div className={`text-xl font-bold ${(latestQuery.data.report.non_commercial_long - latestQuery.data.report.non_commercial_short) >= 0 ? 'text-chart-1' : 'text-chart-2'}`}>
                    {formatSigned(latestQuery.data.report.non_commercial_long - latestQuery.data.report.non_commercial_short)}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Latest Report — below the chart on mobile, right column on desktop */}
          <div className="lg:col-span-1 order-3 lg:order-2">
            {latestQuery.data && historyQuery.data && (
              <MetricsPanel
                data={latestQuery.data.report}
                previousData={historyQuery.data.reports.find((r: any) =>
                  r.source === 'CFTC_API' &&
                  new Date(r.report_date) < new Date(latestQuery.data.report.report_date)
                )}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
