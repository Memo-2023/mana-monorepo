import { apiClient } from './client';
import type { DashboardData, MonthlySummary, CategoryBreakdown, TrendData } from '@finance/shared';

interface Dashboard {
	totals: { currency: string; amount: number }[];
	currentMonth: {
		year: number;
		month: number;
		income: number;
		expense: number;
		net: number;
	};
	budgets: {
		id: string;
		category: { id: string; name: string; color: string } | null;
		amount: number;
		spent: number;
		percentage: number;
	}[];
	recentTransactions: unknown[];
}

interface CategoryBreakdownResponse {
	startDate: string;
	endDate: string;
	type: string;
	total: number;
	categories: {
		categoryId: string | null;
		name: string;
		color: string | null;
		icon: string | null;
		amount: number;
		count: number;
		percentage: number;
	}[];
}

interface TrendsResponse {
	months: number;
	data: {
		year: number;
		month: number;
		income: number;
		expense: number;
		net: number;
	}[];
	averages: {
		income: number;
		expense: number;
		net: number;
	};
}

interface CashFlowResponse {
	startDate: string;
	endDate: string;
	startingBalance: number;
	endingBalance: number;
	data: {
		date: string;
		balance: number;
		income: number;
		expense: number;
	}[];
}

export const reportsApi = {
	getDashboard: () => apiClient.get<Dashboard>('/reports/dashboard'),

	getMonthlySummary: (year?: number, month?: number) => {
		const params = new URLSearchParams();
		if (year) params.append('year', String(year));
		if (month) params.append('month', String(month));
		const query = params.toString();
		return apiClient.get<MonthlySummary>(`/reports/monthly-summary${query ? `?${query}` : ''}`);
	},

	getCategoryBreakdown: (startDate: string, endDate: string, type?: 'income' | 'expense') => {
		const params = new URLSearchParams({ startDate, endDate });
		if (type) params.append('type', type);
		return apiClient.get<CategoryBreakdownResponse>(`/reports/category-breakdown?${params}`);
	},

	getTrends: (months = 6) => apiClient.get<TrendsResponse>(`/reports/trends?months=${months}`),

	getCashFlow: (startDate: string, endDate: string) =>
		apiClient.get<CashFlowResponse>(`/reports/cash-flow?startDate=${startDate}&endDate=${endDate}`),
};
