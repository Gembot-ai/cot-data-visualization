import { useQuery } from '@tanstack/react-query';
import { marketsApi } from '../api/markets.api';

export function useMarkets() {
  return useQuery({
    queryKey: ['markets'],
    queryFn: () => marketsApi.getAll(),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
  });
}

export function useMarket(symbol: string) {
  return useQuery({
    queryKey: ['market', symbol],
    queryFn: () => marketsApi.getBySymbol(symbol),
    staleTime: 1000 * 60 * 60 * 24,
    enabled: !!symbol,
  });
}

export function useMarketsByCategory(category: string) {
  return useQuery({
    queryKey: ['markets-category', category],
    queryFn: () => marketsApi.getByCategory(category),
    staleTime: 1000 * 60 * 60 * 24,
    enabled: !!category,
  });
}
