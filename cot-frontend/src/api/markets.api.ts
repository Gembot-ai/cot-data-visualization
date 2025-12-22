import { apiClient } from './client';
import type { MarketsResponse, Market } from './types';

export const marketsApi = {
  getAll: async (): Promise<MarketsResponse> => {
    const response = await apiClient.get('/markets');
    return response.data;
  },

  getBySymbol: async (symbol: string): Promise<{ market: Market }> => {
    const response = await apiClient.get(`/markets/${symbol}`);
    return response.data;
  },

  getByCategory: async (
    category: string
  ): Promise<{ category: string; markets: Market[]; count: number }> => {
    const response = await apiClient.get(`/markets/category/${category}`);
    return response.data;
  },
};
