import { apiClient } from './client';
import type {
  CotResponse,
  CotHistoryResponse,
  PriceResponse,
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

  getPrices: async (
    marketSymbol: string,
    reportDates?: string[]
  ): Promise<PriceResponse> => {
    const params: any = {};
    if (reportDates && reportDates.length > 0) {
      params.report_dates = reportDates.join(',');
    }
    const response = await apiClient.get(`/cot/${marketSymbol}/prices`, { params });
    return response.data;
  },
};
