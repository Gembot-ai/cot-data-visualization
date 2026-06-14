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
      className="inline-flex items-center justify-center h-11 w-11 rounded-md border border-subtle-border bg-card text-foreground hover:bg-muted/40 transition-colors"
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
    <div className="min-h-screen bg-surface text-foreground safe-top safe-bottom">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-3 sm:py-10 pb-safe">
        {/* Mobile header - simplified and compact */}
        <div className="sm:hidden sticky top-0 z-10 -mx-3 px-3 py-3 bg-surface/95 backdrop-blur-lg border-b border-subtle-border mb-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <a href="https://eccuity.com" target="_blank" rel="noopener noreferrer" className="flex-shrink-0 active:opacity-70 transition-opacity">
                <img src="/images/eccuity-logo.svg" alt="Eccuity" className="h-8 w-8" />
              </a>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-foreground leading-tight truncate">
                  CoT Dashboard
                </h1>
                <p className="text-[10px] text-muted-foreground font-medium truncate">See where retail, hedge funds and commercial hedgers are positioned.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <ThemeToggle />
              {latestQuery.data && (
                <div className="text-right">
                  <div className="text-[10px] text-muted-foreground font-semibold">UPDATED</div>
                  <div className="text-xs font-bold text-foreground">
                    {formatDate(latestQuery.data.report.report_date, { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop header - horizontal */}
        <div className="hidden sm:flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <a href="https://eccuity.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
              <img src="/images/eccuity-logo.svg" alt="Eccuity" className="h-12 w-12" />
            </a>
            <div>
              <h1 className="text-4xl font-bold mb-2 text-foreground">
                Commitment of Traders
              </h1>
              <p className="text-sm text-muted-foreground font-medium">See where retail, hedge funds and commercial hedgers are positioned.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://app.eccuity.com/register"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-6 py-3 rounded-md font-semibold transition-colors"
            >
              Try Eccuity Free
            </a>
            <ThemeToggle />
            <div className="rounded-xl border border-subtle-border bg-card px-6 py-3 shadow-gem">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Last Updated</div>
              <div className="text-lg font-bold text-foreground">
                {latestQuery.data ? formatDate(latestQuery.data.report.report_date) : '—'}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-subtle-border bg-card shadow-gem mb-3 sm:mb-8 p-3 sm:p-6 overflow-visible">
          <MarketSelector selectedMarkets={selectedMarkets} onChange={setSelectedMarkets} multiSelect={false} />
        </div>

        {/* Mobile: Key metrics first in compact cards */}
        <div className="sm:hidden mb-3 grid grid-cols-2 gap-2">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
          <div className="lg:col-span-2 order-2 lg:order-1">
            {historyQuery.data && (
              <StackedBarChart
                data={historyQuery.data.reports}
                priceData={priceQuery.data?.prices}
                priceTicker={priceQuery.data?.ticker}
                priceName={priceQuery.data?.name}
              />
            )}
          </div>
          <div className="lg:col-span-1 order-1 lg:order-2">
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
