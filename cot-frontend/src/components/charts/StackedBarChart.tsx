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
import { Maximize2, Minimize2 } from 'lucide-react';
import type { CotData, PricePoint } from '../../api/types';
import { useThemeObserver } from '../../lib/theme';
import { chartColor, cssVar, withAlpha } from '../../lib/chartColors';
import { formatCompact, formatNumber, formatPrice } from '../../lib/format';

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
  priceData?: PricePoint[];
  priceTicker?: string;
  priceName?: string;
}

type DateRange = '1M' | '3M' | '6M' | '1Y' | '2Y' | '5Y' | 'ALL' | 'CUSTOM';

export const StackedBarChart: React.FC<StackedBarChartProps> = ({
  data,
  priceData,
  priceTicker,
  priceName,
}) => {
  const theme = useThemeObserver();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('1Y');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartKey, setChartKey] = useState(0);

  // Data series visibility state
  const [visibleSeries, setVisibleSeries] = useState({
    smallSpeculators: true,
    largeSpeculators: true,
    commercials: true,
    price: true,
  });

  // e.g. "GLD - SPDR Gold Shares" or just "Price" if no data yet
  const tickerShort = priceTicker ? priceTicker.split('.')[0] : '';
  const priceLabel = priceTicker && priceName
    ? `${tickerShort} - ${priceName}`
    : priceTicker
    ? `Price (${tickerShort})`
    : 'Price';

  // Brand chart palette, read from the @gem/design --chart-* tokens so series
  // colors follow the active light/dark theme. Recomputed each render (the
  // component re-renders when `theme` flips via useThemeObserver), so the values
  // always reflect the current CSS variables.
  // Commercials -> red, Large Speculators -> blue, Small Speculators -> amber, Price -> emerald.
  const colors = {
    smallSpeculators: chartColor(5),
    largeSpeculators: chartColor(4),
    commercials: chartColor(2),
    price: chartColor(1),
  };

  const toggleSeries = (series: keyof typeof visibleSeries) => {
    setVisibleSeries(prev => ({
      ...prev,
      [series]: !prev[series]
    }));
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

  // Force chart re-render when date range or theme changes
  useEffect(() => {
    setChartKey(prev => prev + 1);
  }, [dateRange, customStartDate, customEndDate, theme]);

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

  // Build a price lookup map by date
  const priceLookup = useMemo(() => {
    const map = new Map<string, number>();
    if (priceData) {
      for (const p of priceData) {
        map.set(p.date, p.adjusted_close);
      }
    }
    return map;
  }, [priceData]);

  const chartData = useMemo(() =>
    filteredData
      .slice()
      .reverse()
      .map((d) => {
        const commercialNet = d.commercial_long - d.commercial_short;
        const largeSpecNet = d.non_commercial_long - d.non_commercial_short;
        const smallSpecNet = (d.non_reportable_long || 0) - (d.non_reportable_short || 0);
        const dateKey = new Date(d.report_date).toISOString().split('T')[0];

        return {
          date: new Date(d.report_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: '2-digit',
          }),
          smallSpecNet,
          largeSpecNet,
          commercialNet,
          price: priceLookup.get(dateKey) ?? null,
        };
      }),
    [filteredData, priceLookup]
  );

  const labels = useMemo(() => chartData.map(d => d.date), [chartData]);

  const chartJsData = {
    labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Small Speculators',
        data: visibleSeries.smallSpeculators ? chartData.map(d => d.smallSpecNet) : [],
        backgroundColor: colors.smallSpeculators,
        borderWidth: 0,
        yAxisID: 'y',
        order: 2,
        hidden: !visibleSeries.smallSpeculators,
      },
      {
        type: 'bar' as const,
        label: 'Large Speculators',
        data: visibleSeries.largeSpeculators ? chartData.map(d => d.largeSpecNet) : [],
        backgroundColor: colors.largeSpeculators,
        borderWidth: 0,
        yAxisID: 'y',
        order: 2,
        hidden: !visibleSeries.largeSpeculators,
      },
      {
        type: 'bar' as const,
        label: 'Commercials',
        data: visibleSeries.commercials ? chartData.map(d => d.commercialNet) : [],
        backgroundColor: colors.commercials,
        borderWidth: 0,
        yAxisID: 'y',
        order: 2,
        hidden: !visibleSeries.commercials,
      },
      {
        type: 'line' as const,
        label: priceLabel,
        data: visibleSeries.price ? chartData.map(d => d.price) : [],
        borderColor: withAlpha(colors.price, 0.85),
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        yAxisID: 'y1',
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false,
        tension: 0.4,
        order: 1,
        hidden: !visibleSeries.price,
        spanGaps: true,
      },
    ],
  };

  // Theme-aware chart chrome, read from the brand CSS variables. Gridlines use a
  // low-alpha foreground so they stay visible against bg-card in BOTH themes
  // (in dark, --subtle-border collapses to the card color, so it can't be used here).
  const gridColor = withAlpha(cssVar('--foreground'), 0.08);
  const tickColor = cssVar('--subtle-foreground');

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
        backgroundColor: cssVar('--card'),
        titleColor: cssVar('--foreground'),
        bodyColor: cssVar('--foreground'),
        borderColor: cssVar('--border'),
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (context.dataset.label?.startsWith('Price')) {
                label += formatPrice(context.parsed.y);
              } else {
                label += formatNumber(context.parsed.y);
              }
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
          color: gridColor,
        },
        ticks: {
          color: tickColor,
          font: {
            size: window.innerWidth < 640 ? 8 : 10,
            weight: 500,
          },
          maxRotation: 45,
          minRotation: 45,
          maxTicksLimit: window.innerWidth < 640 ? 8 : undefined,
          autoSkip: true,
          autoSkipPadding: window.innerWidth < 640 ? 5 : 10,
        },
      },
      y: {
        type: 'linear',
        position: 'left',
        title: {
          display: window.innerWidth >= 640,
          text: 'Net Contracts',
          color: tickColor,
          font: {
            size: 11,
            weight: 600,
          },
        },
        grid: {
          color: gridColor,
        },
        ticks: {
          color: tickColor,
          font: {
            size: window.innerWidth < 640 ? 9 : 11,
            weight: 500,
          },
          maxTicksLimit: window.innerWidth < 640 ? 5 : 7,
          callback: function(value: any) {
            return formatCompact(value);
          }
        },
      },
      y1: {
        type: 'linear',
        position: 'right',
        display: visibleSeries.price,
        title: {
          display: window.innerWidth >= 640 && visibleSeries.price,
          text: priceLabel,
          color: colors.price,
          font: {
            size: 11,
            weight: 600,
          },
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: colors.price,
          font: {
            size: window.innerWidth < 640 ? 9 : 11,
            weight: 500,
          },
          maxTicksLimit: window.innerWidth < 640 ? 5 : 7,
          callback: function(value: any) {
            if (Math.abs(value) >= 10000) {
              return formatNumber(value, { maximumFractionDigits: 0 });
            }
            if (Math.abs(value) >= 100) {
              return formatNumber(value, { maximumFractionDigits: 1 });
            }
            return formatNumber(value, { maximumFractionDigits: 2 });
          }
        },
        // Force price to use upper half of chart
        min: (function(context: any) {
          const data = context.chart.data.datasets.find((d: any) => d.yAxisID === 'y1')?.data || [];
          const values = data.filter((v: any) => v !== null && v !== undefined) as number[];
          if (values.length === 0) return 0;
          const minVal = Math.min(...values);
          const maxVal = Math.max(...values);
          const range = maxVal - minVal;
          return minVal - (range * 2);
        }) as any,
        max: (function(context: any) {
          const data = context.chart.data.datasets.find((d: any) => d.yAxisID === 'y1')?.data || [];
          const values = data.filter((v: any) => v !== null && v !== undefined) as number[];
          if (values.length === 0) return 100;
          const maxVal = Math.max(...values);
          const minVal = Math.min(...values);
          const range = maxVal - minVal;
          return maxVal + (range * 0.1);
        }) as any,
      },
    },
  };

  return (
    <div
      ref={chartContainerRef}
      className="w-full rounded-xl border border-subtle-border bg-card shadow-gem p-3 sm:p-6"
    >
      {/* Mobile header - more compact */}
      <div className="sm:hidden mb-3">
        <h3 className="text-base font-bold text-foreground mb-2">
          Net Positions
        </h3>

        {/* Mobile-optimized date range selector */}
        <div className="flex gap-1.5 overflow-x-auto -mx-3 px-3 pb-2 scrollbar-hide">
          {(['1M', '3M', '6M', '1Y', '2Y', 'ALL'] as DateRange[]).map((range) => (
            <button
              key={range}
              onClick={() => {
                setDateRange(range);
                setShowCustomDatePicker(false);
              }}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap min-w-[44px] active:scale-95 ${
                dateRange === range
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-subtle-border bg-card text-foreground/70 hover:bg-muted/40'
              }`}
            >
              {range}
            </button>
          ))}
        </div>

        {/* Mobile legend - compact grid - clickable */}
        <div className="grid grid-cols-2 gap-2 mt-3 text-[10px] font-semibold">
          <button
            onClick={() => toggleSeries('smallSpeculators')}
            className={`flex items-center gap-1.5 p-2 rounded-lg active:scale-95 transition-all ${
              visibleSeries.smallSpeculators ? 'bg-muted/50' : 'bg-muted/30 opacity-40'
            }`}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors.smallSpeculators }}></div>
            <span className="text-muted-foreground truncate">Small Specs</span>
          </button>
          <button
            onClick={() => toggleSeries('largeSpeculators')}
            className={`flex items-center gap-1.5 p-2 rounded-lg active:scale-95 transition-all ${
              visibleSeries.largeSpeculators ? 'bg-muted/50' : 'bg-muted/30 opacity-40'
            }`}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors.largeSpeculators }}></div>
            <span className="text-muted-foreground truncate">Large Specs</span>
          </button>
          <button
            onClick={() => toggleSeries('commercials')}
            className={`flex items-center gap-1.5 p-2 rounded-lg active:scale-95 transition-all ${
              visibleSeries.commercials ? 'bg-muted/50' : 'bg-muted/30 opacity-40'
            }`}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors.commercials }}></div>
            <span className="text-muted-foreground truncate">Commercials</span>
          </button>
          <button
            onClick={() => toggleSeries('price')}
            className={`flex items-center gap-1.5 p-2 rounded-lg active:scale-95 transition-all ${
              visibleSeries.price ? 'bg-muted/50' : 'bg-muted/30 opacity-40'
            }`}
          >
            <div className="w-4 h-0.5 flex-shrink-0" style={{ backgroundColor: colors.price }}></div>
            <span className="text-muted-foreground truncate">{priceLabel}</span>
          </button>
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden sm:flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-foreground">
          Net Positions
        </h3>

        <div className="flex items-center gap-4">
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
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  dateRange === range
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-subtle-border bg-card text-foreground/70 hover:bg-muted/40'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-muted/40 rounded-md transition-colors text-muted-foreground"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Desktop Legend - clickable */}
      <div className="hidden sm:flex flex-wrap items-center gap-3 text-xs font-medium mb-4">
        <button
          onClick={() => toggleSeries('smallSpeculators')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:bg-muted/60 ${
            visibleSeries.smallSpeculators ? 'bg-muted/50' : 'bg-muted/30 opacity-40'
          }`}
        >
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.smallSpeculators }}></div>
          <span className="text-muted-foreground">Small Specs</span>
        </button>
        <button
          onClick={() => toggleSeries('largeSpeculators')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:bg-muted/60 ${
            visibleSeries.largeSpeculators ? 'bg-muted/50' : 'bg-muted/30 opacity-40'
          }`}
        >
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.largeSpeculators }}></div>
          <span className="text-muted-foreground">Large Specs</span>
        </button>
        <button
          onClick={() => toggleSeries('commercials')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:bg-muted/60 ${
            visibleSeries.commercials ? 'bg-muted/50' : 'bg-muted/30 opacity-40'
          }`}
        >
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.commercials }}></div>
          <span className="text-muted-foreground">Commercials</span>
        </button>
        <button
          onClick={() => toggleSeries('price')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:bg-muted/60 ${
            visibleSeries.price ? 'bg-muted/50' : 'bg-muted/30 opacity-40'
          }`}
        >
          <div className="w-8 h-0.5" style={{ backgroundColor: colors.price }}></div>
          <span className="text-muted-foreground">{priceLabel}</span>
        </button>
      </div>

      {/* Custom Date Picker */}
      {showCustomDatePicker && (
        <div className="mb-4 p-4 rounded-lg border border-subtle-border bg-card flex items-center gap-4 flex-wrap">
          <label className="text-sm font-medium text-foreground">From:</label>
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            className="px-3 py-2 rounded-md border border-subtle-border bg-card text-foreground text-sm"
          />
          <label className="text-sm font-medium text-foreground">To:</label>
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
            className="px-3 py-2 rounded-md border border-subtle-border bg-card text-foreground text-sm"
          />
          <button
            onClick={() => setShowCustomDatePicker(false)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Apply
          </button>
        </div>
      )}

      <div className={isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[300px] sm:h-[600px]'}>
        <Chart key={`${chartKey}-${theme}`} type="bar" data={chartJsData as any} options={options} />
      </div>
    </div>
  );
};
