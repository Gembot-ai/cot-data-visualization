import { apiClient } from './client';
import type { MarketsResponse } from './types';

export const marketsApi = {
  getAll: async (): Promise<MarketsResponse> => {
    const response = await apiClient.get('/markets');
    return response.data;
  },
};
