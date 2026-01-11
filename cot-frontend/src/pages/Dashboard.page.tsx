import React, { useState } from 'react';
import { useCotData, useCotHistory } from '../hooks/useCotData';
import { StackedBarChart } from '../components/charts/StackedBarChart';
import { MetricsPanel } from '../components/dashboard/MetricsPanel';
import { MarketSelector } from '../components/dashboard/MarketSelector';

export const DashboardPage: React.FC = () => {
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(['GC']);
  const [darkMode] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const selectedMarket = selectedMarkets[0] || 'GC';
  const latestQuery = useCotData(selectedMarket);

  // Default to 3 months of history
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  const historyQuery = useCotHistory(selectedMarket, threeMonthsAgo);

  const handleUpdateData = async () => {
    setIsUpdating(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const password = (window as any).__APP_PASSWORD__ || '';
      const response = await fetch(`${apiUrl}/api/v1/cot/update${password ? `?password=${password}` : ''}`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Data update started! This will take 5-10 minutes. Refresh the page to see new data.');
      } else {
        alert('Failed to trigger update');
      }
    } catch (error) {
      alert('Error triggering update');
    } finally {
      setIsUpdating(false);
    }
  };

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
    <div className="min-h-screen">
      <div className="max-w-[1600px] mx-auto px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/images/eccuity-logo.svg" alt="Eccuity" className="h-12 w-12" />
            <div>
              <h1 className="text-4xl font-bold mb-2 text-eccuity-dark-300">
                Commitment of Traders
              </h1>
              <p className="text-sm text-eccuity-light-400 font-medium">CFTC Weekly Reports</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleUpdateData}
              disabled={isUpdating}
              className="glass-strong px-6 py-3 rounded-2xl shadow-glass hover:shadow-lg hover:border-eccuity-coral/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-xs font-semibold text-eccuity-light-400 uppercase tracking-wider mb-1">
                {isUpdating ? 'Updating...' : 'Update Data'}
              </div>
              <div className="text-sm font-bold text-eccuity-dark-300">
                {isUpdating ? '⏳ Please wait' : '🔄 Refresh Now'}
              </div>
            </button>
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

        <div className="glass-strong mb-8 p-6 rounded-2xl shadow-glass overflow-visible">
          <MarketSelector selectedMarkets={selectedMarkets} onChange={setSelectedMarkets} darkMode={darkMode} multiSelect={false} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            {historyQuery.data && (
              <StackedBarChart
                data={historyQuery.data.reports}
                darkMode={darkMode}
              />
            )}
          </div>
          <div className="xl:col-span-1">
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
