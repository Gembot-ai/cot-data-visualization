import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMarkets } from '../../hooks/useMarkets';
import type { Market } from '../../api/types';

interface MarketSelectorProps {
  selectedMarkets: string[];
  onChange: (markets: string[]) => void;
  darkMode?: boolean;
  multiSelect?: boolean;
}

export const MarketSelector: React.FC<MarketSelectorProps> = ({
  selectedMarkets,
  onChange,
  darkMode = false,
  multiSelect = false,
}) => {
  const { data: marketsData, isLoading } = useMarkets();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  const handleMarketToggle = (symbol: string) => {
    if (multiSelect) {
      if (selectedMarkets.includes(symbol)) {
        onChange(selectedMarkets.filter((m) => m !== symbol));
      } else {
        onChange([...selectedMarkets, symbol]);
      }
    } else {
      onChange([symbol]);
      setIsOpen(false);
    }
  };

  const groupedMarkets = React.useMemo(() => {
    if (!marketsData?.markets) return {};

    const filtered = marketsData.markets.filter(
      (market) =>
        market.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        market.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.reduce((acc, market) => {
      if (!acc[market.category]) {
        acc[market.category] = [];
      }
      acc[market.category].push(market);
      return acc;
    }, {} as Record<string, Market[]>);
  }, [marketsData, searchTerm]);

  const selectedMarket = marketsData?.markets.find(
    (m) => m.symbol === selectedMarkets[0]
  );

  // Update dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (isLoading) {
    return (
      <div className="glass-strong px-4 py-3 rounded-xl animate-pulse">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-32"></div>
      </div>
    );
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="glass-strong w-full sm:w-auto px-6 py-3 rounded-xl shadow-glass dark:shadow-glass-dark hover:scale-105 transition-transform duration-200 flex items-center justify-between gap-4 min-w-[280px]"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {selectedMarket?.symbol || 'Select Market'}
          </span>
          {selectedMarket && (
            <>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {selectedMarket.name}
              </span>
            </>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed w-full sm:w-[500px] glass-strong rounded-xl shadow-2xl p-4 max-h-[500px] overflow-hidden flex flex-col"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            minWidth: dropdownPosition.width,
            zIndex: 9999
          }}
        >
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search markets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
              autoFocus
            />
          </div>

          {/* Markets list */}
          <div className="overflow-y-auto flex-1 -mx-2 px-2 space-y-4">
            {Object.entries(groupedMarkets).map(([category, markets]) => (
              <div key={category}>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 px-2">
                  {category}
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {markets.map((market) => (
                    <button
                      key={market.symbol}
                      onClick={() => handleMarketToggle(market.symbol)}
                      className={`text-left px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                        selectedMarkets.includes(market.symbol)
                          ? 'bg-brand-500 text-white shadow-md scale-[1.02]'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="font-mono font-bold text-xs mb-0.5">
                        {market.symbol}
                      </div>
                      <div className="text-xs opacity-80 truncate">
                        {market.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {Object.keys(groupedMarkets).length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No markets found
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
};
