import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search } from 'lucide-react';
import { useMarkets } from '../../hooks/useMarkets';
import type { Market } from '../../api/types';
import { Skeleton } from '../ui/Skeleton';

interface MarketSelectorProps {
  selectedMarkets: string[];
  onChange: (markets: string[]) => void;
  multiSelect?: boolean;
}

export const MarketSelector: React.FC<MarketSelectorProps> = ({
  selectedMarkets,
  onChange,
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
      <div className="rounded-lg sm:rounded-xl border border-subtle-border bg-card px-4 py-3">
        <Skeleton className="h-6 w-32" />
      </div>
    );
  }

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select market"
        className="w-full rounded-lg sm:rounded-xl border border-subtle-border bg-card px-3 sm:px-6 py-2.5 sm:py-3 active:scale-95 sm:hover:bg-muted/40 transition-all duration-200 flex items-center justify-between gap-2 sm:gap-4 min-h-[48px]"
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <span className="text-base sm:text-2xl font-bold text-foreground whitespace-nowrap">
            {selectedMarket?.symbol || 'Select'}
          </span>
          {selectedMarket && (
            <>
              <div className="h-4 sm:h-6 w-px bg-subtle-border"></div>
              <span className="text-xs sm:text-sm text-muted-foreground font-medium truncate">
                {selectedMarket.name}
              </span>
            </>
          )}
        </div>
        <ChevronDown
          className={`w-4 sm:w-5 h-4 sm:h-5 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed left-3 right-3 sm:left-auto sm:right-auto sm:w-[500px] rounded-2xl border border-subtle-border bg-popover text-popover-foreground shadow-2xl p-3 sm:p-4 max-h-[75vh] sm:max-h-[500px] overflow-hidden flex flex-col"
          style={{
            top: dropdownPosition.top,
            left: window.innerWidth >= 640 ? dropdownPosition.left : '0.75rem',
            right: window.innerWidth >= 640 ? 'auto' : '0.75rem',
            zIndex: 9999
          }}
        >
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search markets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-subtle-border bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-base"
              autoFocus
            />
          </div>

          {/* Markets list */}
          <div className="overflow-y-auto flex-1 -mx-1 px-1 space-y-3">
            {Object.entries(groupedMarkets).map(([category, markets]) => (
              <div key={category}>
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-2">
                  {category}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {markets.map((market) => (
                    <button
                      key={market.symbol}
                      onClick={() => handleMarketToggle(market.symbol)}
                      className={`text-left px-3 py-3 rounded-xl text-sm border transition-all duration-150 min-h-[56px] active:scale-95 ${
                        selectedMarkets.includes(market.symbol)
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-subtle-border bg-card-muted hover:bg-muted/60 text-foreground'
                      }`}
                    >
                      <div className="font-mono font-bold text-sm mb-0.5">
                        {market.symbol}
                      </div>
                      <div className="text-[11px] opacity-80 truncate">
                        {market.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {Object.keys(groupedMarkets).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No markets found
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
};
