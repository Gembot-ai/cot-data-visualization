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
    <div className="group relative p-3 sm:p-5 rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 hover:border-brand-500 dark:hover:border-brand-400 transition-all duration-200 hover:shadow-lg">
      {icon && (
        <div className="hidden sm:block absolute top-4 right-4 opacity-20 group-hover:opacity-30 transition-opacity">
          {icon}
        </div>
      )}
      <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
        {label}
      </div>
      <div className={`text-xl sm:text-3xl font-bold ${color || 'text-gray-900 dark:text-white'}`}>
        {value}
      </div>
      {change !== undefined && change !== 0 && (
        <div className={`text-[10px] sm:text-sm mt-1 font-semibold flex items-center gap-1 ${
          change > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
        }`}>
          {change > 0 ? '▲' : '▼'} {Math.abs(change).toLocaleString()}
          <span className="hidden sm:inline">from last week</span>
        </div>
      )}
      {subValue && (
        <div className="text-[10px] sm:text-xs mt-1 sm:mt-2 font-medium text-gray-500 dark:text-gray-400">
          {subValue}
        </div>
      )}
    </div>
  );

  return (
    <div className="glass-strong p-3 sm:p-6 rounded-xl sm:rounded-2xl shadow-glass dark:shadow-glass-dark h-fit lg:sticky lg:top-6">
      <h3 className="text-base sm:text-2xl font-bold mb-3 sm:mb-6 text-gray-900 dark:text-white">
        Latest Report
      </h3>

      <div className="space-y-2 sm:space-y-4">
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
            Detailed Positions
          </div>
          <div className="space-y-4">
            {/* Commercial Positions */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-3 sm:p-4 rounded-xl">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">COMMERCIAL</div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Long</div>
                  <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {data.commercial_long.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {commercialLongPct.toFixed(1)}% of OI
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Short</div>
                  <div className="text-base sm:text-lg font-bold text-red-600 dark:text-red-400">
                    {data.commercial_short.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {commercialShortPct.toFixed(1)}% of OI
                  </div>
                </div>
              </div>
            </div>

            {/* Speculative Positions */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-3 sm:p-4 rounded-xl">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">SPECULATIVE</div>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Long</div>
                  <div className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {data.non_commercial_long.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {nonCommercialLongPct.toFixed(1)}% of OI
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Short</div>
                  <div className="text-base sm:text-lg font-bold text-red-600 dark:text-red-400">
                    {data.non_commercial_short.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {nonCommercialShortPct.toFixed(1)}% of OI
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
