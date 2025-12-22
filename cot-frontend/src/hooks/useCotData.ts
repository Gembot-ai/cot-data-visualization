import { useQuery } from '@tanstack/react-query';
import { cotApi } from '../api/cot.api';

export function useCotData(marketSymbol: string) {
  return useQuery({
    queryKey: ['cot', marketSymbol],
    queryFn: () => cotApi.getLatest(marketSymbol),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 2,
  });
}

export function useCotHistory(
  marketSymbol: string,
  startDate?: Date,
  endDate?: Date
) {
  return useQuery({
    queryKey: ['cot-history', marketSymbol, startDate, endDate],
    queryFn: () => cotApi.getHistory(marketSymbol, startDate, endDate),
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
    retry: 2,
  });
}

export function useMarketComparison(marketSymbols: string[]) {
  return useQuery({
    queryKey: ['comparison', marketSymbols],
    queryFn: () => cotApi.getBatch(marketSymbols),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    enabled: marketSymbols.length > 0,
  });
}

export function useAllLatestCot() {
  return useQuery({
    queryKey: ['cot-all-latest'],
    queryFn: () => cotApi.getAllLatest(),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24,
  });
}
