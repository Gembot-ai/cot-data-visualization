import React, { useState } from 'react';
import { useCotData, useCotHistory } from '../hooks/useCotData';
import { StackedBarChart } from '../components/charts/StackedBarChart';
import { MetricsPanel } from '../components/dashboard/MetricsPanel';
import { MarketSelector } from '../components/dashboard/MarketSelector';

export const DashboardPage: React.FC = () => {
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(['GC']);
  const [darkMode] = useState(false);

  const defaultDates = React.useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 365);
    return { start, end };
  }, []);

  const [startDate, setStartDate] = useState<Date>(defaultDates.start);
  const [endDate, setEndDate] = useState<Date>(defaultDates.end);

  const selectedMarket = selectedMarkets[0] || 'GC';
  const latestQuery = useCotData(selectedMarket);
  const historyQuery = useCotHistory(selectedMarket, startDate, endDate);

  if (latestQuery.isLoading || historyQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-brand-500 rounded-full animate-spin"></div>
          </div>
          <div className="text-2xl font-bold mb-2">Loading CoT Data...</div>
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
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
            <MarketSelector selectedMarkets={selectedMarkets} onChange={setSelectedMarkets} darkMode={darkMode} multiSelect={false} />
            <div className="flex-1 flex flex-wrap gap-3 items-center justify-end">
              <div className="flex gap-2">
                <button onClick={() => { const end = new Date(); const start = new Date(); start.setMonth(start.getMonth() - 6); setStartDate(start); setEndDate(end); }} className="px-3 py-2 text-xs font-bold rounded-lg bg-gray-100 hover:bg-brand-500 hover:text-white text-gray-700 transition-all">6M</button>
                <button onClick={() => { const end = new Date(); const start = new Date(); start.setFullYear(start.getFullYear() - 1); setStartDate(start); setEndDate(end); }} className="px-3 py-2 text-xs font-bold rounded-lg bg-gray-100 hover:bg-brand-500 hover:text-white text-gray-700 transition-all">1Y</button>
                <button onClick={() => { const end = new Date(); const start = new Date(); start.setFullYear(start.getFullYear() - 2); setStartDate(start); setEndDate(end); }} className="px-3 py-2 text-xs font-bold rounded-lg bg-gray-100 hover:bg-brand-500 hover:text-white text-gray-700 transition-all">2Y</button>
                <button onClick={() => { const end = new Date(); const start = new Date(); start.setFullYear(start.getFullYear() - 5); setStartDate(start); setEndDate(end); }} className="px-3 py-2 text-xs font-bold rounded-lg bg-gray-100 hover:bg-brand-500 hover:text-white text-gray-700 transition-all">5Y</button>
                <button onClick={() => { const end = new Date(); const start = new Date(); start.setFullYear(start.getFullYear() - 20); setStartDate(start); setEndDate(end); }} className="px-3 py-2 text-xs font-bold rounded-lg bg-gray-100 hover:bg-brand-500 hover:text-white text-gray-700 transition-all">All</button>
              </div>
              <div className="text-xs text-gray-500 font-medium">
                {new Date(startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - {new Date(endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            {historyQuery.data && historyQuery.data.reports.length > 0 && (
              <StackedBarChart data={[...historyQuery.data.reports, ...(latestQuery.data && !historyQuery.data.reports.some(r => r.report_date === latestQuery.data.report.report_date) ? [latestQuery.data.report] : [])]} darkMode={darkMode} />
            )}
          </div>
          <div className="xl:col-span-1">
            {latestQuery.data && historyQuery.data && (
              <MetricsPanel data={latestQuery.data.report} previousData={historyQuery.data.reports.find((r: any) => r.source === 'CFTC_API' && new Date(r.report_date) < new Date(latestQuery.data.report.report_date))} darkMode={darkMode} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
