import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCotData, useCotHistory } from '../hooks/useCotData';
import { StackedBarChart } from '../components/charts/StackedBarChart';
import { MetricsPanel } from '../components/dashboard/MetricsPanel';
import { MarketSelector } from '../components/dashboard/MarketSelector';

export const DashboardPage: React.FC = () => {
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(['GC']);
  const [darkMode] = useState(false);

  const selectedMarket = selectedMarkets[0] || 'GC';
  const latestQuery = useCotData(selectedMarket);
  const historyQuery = useCotHistory(selectedMarket);

  if (latestQuery.isLoading || historyQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin"></div>
          </div>
          <div className="text-2xl font-bold mb-2">Loading CoT Data...</div>
          <div className="text-sm text-gray-500">
            Latest: {latestQuery.isLoading ? 'loading...' : 'done'} |
            History: {historyQuery.isLoading ? 'loading...' : 'done'}
          </div>
        </div>
      </div>
    );
  }

  if (latestQuery.isError || historyQuery.isError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center glass-strong p-8 rounded-3xl max-w-md">
          <div className="text-2xl font-bold mb-2 text-red-600">Error loading data</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen safe-top safe-bottom">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 py-3 sm:py-10 pb-safe">
        {/* Mobile header - simplified and compact */}
        <div className="sm:hidden sticky top-0 z-10 -mx-3 px-3 py-3 bg-eccuity-light-100/95 backdrop-blur-lg border-b border-eccuity-light-200 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <a href="https://eccuity.com" target="_blank" rel="noopener noreferrer" className="active:opacity-70 transition-opacity">
                <img src="/images/eccuity-logo.svg" alt="Eccuity" className="h-8 w-8" />
              </a>
              <div>
                <h1 className="text-lg font-bold text-eccuity-dark-300 leading-tight">
                  CoT Dashboard
                </h1>
                <p className="text-[10px] text-eccuity-light-400 font-medium">CFTC Weekly Reports</p>
              </div>
            </div>
            {latestQuery.data && (
              <div className="text-right">
                <div className="text-[10px] text-eccuity-light-400 font-semibold">UPDATED</div>
                <div className="text-xs font-bold text-eccuity-dark-300">
                  {new Date(latestQuery.data.report.report_date).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric'
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop header - horizontal */}
        <div className="hidden sm:flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <a href="https://eccuity.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
              <img src="/images/eccuity-logo.svg" alt="Eccuity" className="h-12 w-12" />
            </a>
            <div>
              <h1 className="text-4xl font-bold mb-2 text-eccuity-dark-300">
                Commitment of Traders
              </h1>
              <p className="text-sm text-eccuity-light-400 font-medium">CFTC Weekly Reports</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/admin"
              className="glass-strong px-4 py-3 rounded-2xl shadow-glass hover:shadow-lg hover:border-eccuity-coral/30 transition-all"
            >
              <div className="text-xs font-semibold text-eccuity-light-400 uppercase tracking-wider mb-1">
                Admin
              </div>
              <div className="text-sm font-bold text-eccuity-dark-300">
                Settings
              </div>
            </Link>
            <div className="glass-strong px-6 py-3 rounded-2xl shadow-glass border-eccuity-coral/20">
              <div className="text-xs font-semibold text-eccuity-light-400 uppercase tracking-wider mb-1">Last Updated</div>
              <div className="text-lg font-bold text-eccuity-dark-300">
                {latestQuery.data ? new Date(latestQuery.data.report.report_date).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric'
                }) : '—'}
              </div>
            </div>
          </div>
        </div>

        <div className="glass-strong mb-3 sm:mb-8 p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-glass overflow-visible">
          <MarketSelector selectedMarkets={selectedMarkets} onChange={setSelectedMarkets} darkMode={darkMode} multiSelect={false} />
        </div>

        {/* Mobile: Key metrics first in compact cards */}
        <div className="sm:hidden mb-3 grid grid-cols-2 gap-2">
          {latestQuery.data && (
            <>
              <div className="glass-strong p-3 rounded-xl">
                <div className="text-[10px] font-bold text-eccuity-light-400 uppercase tracking-wider mb-1">Commercial Net</div>
                <div className={`text-xl font-bold ${(latestQuery.data.report.commercial_long - latestQuery.data.report.commercial_short) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {((latestQuery.data.report.commercial_long - latestQuery.data.report.commercial_short) >= 0 ? '+' : '')}
                  {(latestQuery.data.report.commercial_long - latestQuery.data.report.commercial_short).toLocaleString()}
                </div>
              </div>
              <div className="glass-strong p-3 rounded-xl">
                <div className="text-[10px] font-bold text-eccuity-light-400 uppercase tracking-wider mb-1">Speculative Net</div>
                <div className={`text-xl font-bold ${(latestQuery.data.report.non_commercial_long - latestQuery.data.report.non_commercial_short) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {((latestQuery.data.report.non_commercial_long - latestQuery.data.report.non_commercial_short) >= 0 ? '+' : '')}
                  {(latestQuery.data.report.non_commercial_long - latestQuery.data.report.non_commercial_short).toLocaleString()}
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
                darkMode={darkMode}
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
                darkMode={darkMode}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
