import React from 'react';
import type { CotData } from '../../api/types';

interface MetricsPanelProps {
  data: CotData;
  previousData?: CotData;
  darkMode?: boolean;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  data,
  previousData,
  darkMode = false,
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
    <div className="group relative p-5 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 hover:border-brand-500 dark:hover:border-brand-400 transition-all duration-200 hover:shadow-lg">
      {icon && (
        <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-30 transition-opacity">
          {icon}
        </div>
      )}
      <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
        {label}
      </div>
      <div className={`text-3xl font-bold ${color || 'text-gray-900 dark:text-white'}`}>
        {value}
      </div>
      {change !== undefined && change !== 0 && (
        <div className={`text-sm mt-1 font-semibold flex items-center gap-1 ${
          change > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
        }`}>
          {change > 0 ? '▲' : '▼'} {Math.abs(change).toLocaleString()} from last week
        </div>
      )}
      {subValue && (
        <div className="text-xs mt-2 font-medium text-gray-500 dark:text-gray-400">
          {subValue}
        </div>
      )}
    </div>
  );

  return (
    <div className="glass-strong p-6 rounded-2xl shadow-glass dark:shadow-glass-dark h-fit sticky top-6">
      <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Latest Report
      </h3>

      <div className="space-y-4">
        <MetricCard
          label="Report Date"
          value={new Date(data.report_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
          icon={
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
          }
        />

        <MetricCard
          label="Open Interest"
          value={data.open_interest.toLocaleString()}
          change={openInterestChange}
          subValue="Total contracts"
          icon={
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
          }
        />

        <MetricCard
          label="Commercial Net"
          value={`${commercialNet >= 0 ? '+' : ''}${commercialNet.toLocaleString()}`}
          change={commercialNetChange}
          subValue={`${((commercialNet / data.open_interest) * 100).toFixed(1)}% of OI`}
          color={commercialNet >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}
          icon={
            commercialNet >= 0 ? (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )
          }
        />

        <MetricCard
          label="Speculative Net"
          value={`${nonCommercialNet >= 0 ? '+' : ''}${nonCommercialNet.toLocaleString()}`}
          change={nonCommercialNetChange}
          subValue={`${((nonCommercialNet / data.open_interest) * 100).toFixed(1)}% of OI`}
          color={nonCommercialNet >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}
          icon={
            nonCommercialNet >= 0 ? (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )
          }
        />

        <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
            Position Breakdown
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Commercial Long</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{commercialLongPct.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-red-500 h-2 rounded-full transition-all duration-500" style={{ width: `${commercialLongPct}%` }}></div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Commercial Short</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{commercialShortPct.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-red-400 h-2 rounded-full transition-all duration-500" style={{ width: `${commercialShortPct}%` }}></div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Speculative Long</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{nonCommercialLongPct.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${nonCommercialLongPct}%` }}></div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Speculative Short</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{nonCommercialShortPct.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-blue-400 h-2 rounded-full transition-all duration-500" style={{ width: `${nonCommercialShortPct}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
