import { apiClient } from './client';
import type {
  CotResponse,
  CotHistoryResponse,
  CotBatchResponse,
} from './types';

export const cotApi = {
  getLatest: async (marketSymbol: string): Promise<CotResponse> => {
    const response = await apiClient.get(`/cot/${marketSymbol}`);
    return response.data;
  },

  getHistory: async (
    marketSymbol: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<CotHistoryResponse> => {
    const params: any = {};
    if (startDate) params.start = startDate.toISOString();
    if (endDate) params.end = endDate.toISOString();

    const response = await apiClient.get(`/cot/${marketSymbol}/history`, {
      params,
    });
    return response.data;
  },

  getBatch: async (marketSymbols: string[]): Promise<CotBatchResponse> => {
    const response = await apiClient.get('/cot/batch', {
      params: { markets: marketSymbols.join(',') },
    });
    return response.data;
  },

  getAllLatest: async (): Promise<CotBatchResponse> => {
    const response = await apiClient.get('/cot/latest/all');
    return response.data;
  },
};
