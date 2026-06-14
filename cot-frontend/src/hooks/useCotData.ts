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

export function useAssetPrices(
  marketSymbol: string,
  reportDates?: string[]
) {
  return useQuery({
    queryKey: ['asset-prices', marketSymbol, reportDates],
    queryFn: () => cotApi.getPrices(marketSymbol, reportDates),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7,
    retry: 1,
    enabled: !!marketSymbol && (reportDates?.length ?? 0) > 0,
  });
}
