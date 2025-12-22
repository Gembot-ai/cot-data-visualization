import React, { useState } from 'react';
import { useCotData, useCotHistory } from '../hooks/useCotData';
import { StackedBarChart } from '../components/charts/StackedBarChart';
import { MetricsPanel } from '../components/dashboard/MetricsPanel';
import { MarketSelector } from '../components/dashboard/MarketSelector';

export const DashboardPage: React.FC = () => {
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(['GC']);
  const [darkMode] = useState(false);
  const [allData, setAllData] = useState<any[]>([]);

  const selectedMarket = selectedMarkets[0] || 'GC';
  const latestQuery = useCotData(selectedMarket);

  // Fetch all historical data (no date params = get everything from DB)
  const historyQuery = useCotHistory(selectedMarket);

  React.useEffect(() => {
    if (historyQuery.data?.reports) {
      setAllData(historyQuery.data.reports);
    }
  }, [historyQuery.data]);

  // Debug logging
  console.log('Query states:', {
    latestLoading: latestQuery.isLoading,
    latestError: latestQuery.isError,
    latestData: !!latestQuery.data,
    historyLoading: historyQuery.isLoading,
    historyError: historyQuery.isError,
    historyData: !!historyQuery.data,
    historyReports: historyQuery.data?.reports?.length
  });

  // Only block on initial queries, not background fetch
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
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Commitment of Traders
            </h1>
            <p className="text-sm text-gray-600 font-medium">CFTC Weekly Reports</p>
          </div>
          <div className="glass-strong px-6 py-3 rounded-2xl shadow-glass">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Last Updated</div>
            <div className="text-lg font-bold text-gray-900">
              {latestQuery.data ? new Date(latestQuery.data.report.report_date).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
              }) : '—'}
            </div>
          </div>
        </div>

        <div className="glass-strong mb-8 p-6 rounded-2xl shadow-glass overflow-visible">
          <MarketSelector selectedMarkets={selectedMarkets} onChange={setSelectedMarkets} darkMode={darkMode} multiSelect={false} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            {allData.length > 0 && (
              <StackedBarChart data={[...allData, ...(latestQuery.data && !allData.some(r => r.report_date === latestQuery.data.report.report_date) ? [latestQuery.data.report] : [])]} darkMode={darkMode} />
            )}
          </div>
          <div className="xl:col-span-1">
            {latestQuery.data && allData.length > 0 && (
              <MetricsPanel data={latestQuery.data.report} previousData={allData.find((r: any) => r.source === 'CFTC_API' && new Date(r.report_date) < new Date(latestQuery.data.report.report_date))} darkMode={darkMode} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
