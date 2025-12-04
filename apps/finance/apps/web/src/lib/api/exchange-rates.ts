import { apiClient } from './client';

interface ExchangeRate {
	fromCurrency: string;
	toCurrency: string;
	rate: number;
	date: string;
}

export const exchangeRatesApi = {
	getAll: (baseCurrency = 'EUR') =>
		apiClient.get<ExchangeRate[]>(`/exchange-rates?base=${baseCurrency}`),

	getRate: (fromCurrency: string, toCurrency: string) =>
		apiClient.get<number>(`/exchange-rates/rate?from=${fromCurrency}&to=${toCurrency}`),

	convert: (amount: number, fromCurrency: string, toCurrency: string) =>
		apiClient.get<number>(
			`/exchange-rates/convert?amount=${amount}&from=${fromCurrency}&to=${toCurrency}`
		),

	seed: () => apiClient.post<{ message: string; seeded: boolean }>('/exchange-rates/seed'),

	fetch: () => apiClient.post<void>('/exchange-rates/fetch'),
};
