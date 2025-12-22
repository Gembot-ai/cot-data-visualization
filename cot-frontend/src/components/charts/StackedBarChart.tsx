import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineElement,
  LineController,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import type { CotData } from '../../api/types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineElement,
  LineController,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface StackedBarChartProps {
  data: CotData[];
  darkMode?: boolean;
}

type DateRange = '1M' | '3M' | '6M' | '1Y' | '2Y' | '5Y' | 'ALL' | 'CUSTOM';

export const StackedBarChart: React.FC<StackedBarChartProps> = ({
  data,
  darkMode = false,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('1Y');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartKey, setChartKey] = useState(0);

  const colors = {
    smallSpeculators: '#fbbf24',
    largeSpeculators: '#3b82f6',
    commercials: '#ef4444',
    openInterest: '#10b981',
  };

  const toggleFullscreen = () => {
    if (!chartContainerRef.current) return;

    if (!isFullscreen) {
      chartContainerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Force chart re-render when date range changes
  useEffect(() => {
    setChartKey(prev => prev + 1);
  }, [dateRange, customStartDate, customEndDate]);

  // Memoize filtered data to avoid recalculation on every render
  const filteredData = useMemo(() => {
    // Prefer CFTC_API data, but include all data if no CFTC data exists
    const hasCFTCData = data.some((d: any) => d.source === 'CFTC_API');
    let processed = hasCFTCData
      ? data.filter((d: any) => d.source === 'CFTC_API' || !d.source)
      : data;

    // Deduplicate by date - keep entry with highest open interest
    const dateMap = new Map();
    processed.forEach((d: any) => {
      const dateKey = new Date(d.report_date).toISOString().split('T')[0];
      const existing = dateMap.get(dateKey);
      if (!existing || d.open_interest > existing.open_interest) {
        dateMap.set(dateKey, d);
      }
    });
    processed = Array.from(dateMap.values());

    // Apply date range filter
    if (dateRange === 'CUSTOM' && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      return processed.filter(d => {
        const reportDate = new Date(d.report_date);
        return reportDate >= start && reportDate <= end;
      });
    }

    if (dateRange === 'ALL') return processed;

    const now = new Date();
    let cutoffDate: Date;

    switch (dateRange) {
      case '1M':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '3M':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case '6M':
        cutoffDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case '1Y':
        cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case '2Y':
        cutoffDate = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
        break;
      case '5Y':
        cutoffDate = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate());
        break;
      default:
        return processed;
    }

    return processed.filter(d => new Date(d.report_date) >= cutoffDate);
  }, [data, dateRange, customStartDate, customEndDate]);

  const chartData = useMemo(() =>
    filteredData
      .slice()
      .reverse()
      .map((d) => {
        const commercialNet = d.commercial_long - d.commercial_short;
        const largeSpecNet = d.non_commercial_long - d.non_commercial_short;
        const smallSpecNet = (d.non_reportable_long || 0) - (d.non_reportable_short || 0);

        return {
          date: new Date(d.report_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: '2-digit',
          }),
          smallSpecNet,
          largeSpecNet,
          commercialNet,
          openInterest: d.open_interest,
        };
      }),
    [filteredData]
  );

  const labels = useMemo(() => chartData.map(d => d.date), [chartData]);

  const chartJsData = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Small Speculators',
        data: chartData.map(d => d.smallSpecNet),
        backgroundColor: colors.smallSpeculators,
        borderWidth: 0,
        yAxisID: 'y',
        order: 2,
      },
      {
        type: 'bar' as const,
        label: 'Large Speculators',
        data: chartData.map(d => d.largeSpecNet),
        backgroundColor: colors.largeSpeculators,
        borderWidth: 0,
        yAxisID: 'y',
        order: 2,
      },
      {
        type: 'bar' as const,
        label: 'Commercials',
        data: chartData.map(d => d.commercialNet),
        backgroundColor: colors.commercials,
        borderWidth: 0,
        yAxisID: 'y',
        order: 2,
      },
      {
        type: 'line' as const,
        label: 'Open Interest',
        data: chartData.map(d => d.openInterest),
        borderColor: 'rgba(16, 185, 129, 0.7)', // 70% opacity green
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        yAxisID: 'y1',
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false,
        tension: 0.4,
        order: 1,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: darkMode ? '#fff' : '#000',
        bodyColor: darkMode ? '#fff' : '#000',
        borderColor: darkMode ? '#374151' : '#e5e7eb',
        borderWidth: 2,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toLocaleString();
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: darkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.5)',
        },
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280',
          font: {
            size: 10,
            weight: 500,
          },
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        type: 'linear',
        position: 'left',
        title: {
          display: true,
          text: 'Net Contracts',
          color: darkMode ? '#9ca3af' : '#6b7280',
          font: {
            size: 12,
            weight: 600,
          },
        },
        grid: {
          color: darkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.5)',
        },
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280',
          font: {
            weight: 500,
          },
          callback: function(value: any) {
            return (value / 1000).toFixed(0) + 'K';
          }
        },
      },
      y1: {
        type: 'linear',
        position: 'right',
        title: {
          display: true,
          text: 'Open Interest',
          color: colors.openInterest,
          font: {
            size: 12,
            weight: 600,
          },
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: colors.openInterest,
          font: {
            weight: 500,
          },
          callback: function(value: any) {
            return (value / 1000).toFixed(0) + 'K';
          }
        },
        // Force open interest to use upper half of chart
        min: (function(context: any) {
          const data = context.chart.data.datasets.find((d: any) => d.yAxisID === 'y1')?.data || [];
          const values = data.filter((v: any) => v !== null && v !== undefined) as number[];
          if (values.length === 0) return 0;
          const minVal = Math.min(...values);
          const maxVal = Math.max(...values);
          const range = maxVal - minVal;
          // Start scale at min - (range * 2) to push line to top half
          return minVal - (range * 2);
        }) as any,
        max: (function(context: any) {
          const data = context.chart.data.datasets.find((d: any) => d.yAxisID === 'y1')?.data || [];
          const values = data.filter((v: any) => v !== null && v !== undefined) as number[];
          if (values.length === 0) return 100;
          const maxVal = Math.max(...values);
          const minVal = Math.min(...values);
          const range = maxVal - minVal;
          // Add small padding at top
          return maxVal + (range * 0.1);
        }) as any,
      },
    },
  };

  return (
    <div
      ref={chartContainerRef}
      className={`glass-strong w-full p-6 rounded-2xl shadow-glass dark:shadow-glass-dark ${
        isFullscreen ? 'bg-white dark:bg-gray-900' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          Net Positions
        </h3>

        <div className="flex items-center gap-6 flex-wrap">
          {/* Date Range Selector */}
          <div className="flex items-center gap-2">
            {(['1M', '3M', '6M', '1Y', '2Y', '5Y', 'ALL', 'CUSTOM'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => {
                  setDateRange(range);
                  if (range === 'CUSTOM') {
                    setShowCustomDatePicker(true);
                  } else {
                    setShowCustomDatePicker(false);
                  }
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.smallSpeculators }}></div>
              <span className="text-gray-600 dark:text-gray-400">Small Specs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.largeSpeculators }}></div>
              <span className="text-gray-600 dark:text-gray-400">Large Specs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.commercials }}></div>
              <span className="text-gray-600 dark:text-gray-400">Commercials</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5" style={{ backgroundColor: colors.openInterest }}></div>
              <span className="text-gray-600 dark:text-gray-400">Open Interest</span>
            </div>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Custom Date Picker */}
      {showCustomDatePicker && (
        <div className="mb-4 p-4 glass-strong rounded-lg flex items-center gap-4 flex-wrap">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">From:</label>
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          />
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">To:</label>
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          />
          <button
            onClick={() => setShowCustomDatePicker(false)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            Apply
          </button>
        </div>
      )}

      <div className={isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[600px]'}>
        <Chart key={chartKey} type="bar" data={chartJsData as any} options={options} />
      </div>
    </div>
  );
};
