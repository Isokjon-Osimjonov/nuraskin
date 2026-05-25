import { api } from '@/lib/api';
import type { ExchangeRateResponse, CreateExchangeRateInput } from '@nuraskin/shared-types';



export const exchangeRatesApi = {
  getLatest: (): Promise<ExchangeRateResponse> => api.get<any>('/exchange-rates/latest'),
  list: (): Promise<ExchangeRateResponse[]> => api.get<any>('/exchange-rates'),
  create: (data: CreateExchangeRateInput): Promise<ExchangeRateResponse> =>
    api.post<any>('/exchange-rates', data),
};

