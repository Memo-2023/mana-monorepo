import { reportsApi } from '$lib/api';

interface DashboardData {
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

let data = $state<DashboardData | null>(null);
let isLoading = $state(false);
let error = $state<string | null>(null);

export const dashboardStore = {
	get data() {
		return data;
	},
	get isLoading() {
		return isLoading;
	},
	get error() {
		return error;
	},

	get primaryTotal() {
		if (!data?.totals?.length) return 0;
		// Return EUR total if available, otherwise first currency
		const eurTotal = data.totals.find((t) => t.currency === 'EUR');
		return eurTotal?.amount ?? data.totals[0]?.amount ?? 0;
	},

	get monthlyNet() {
		return data?.currentMonth?.net ?? 0;
	},

	get budgetProgress() {
		return data?.budgets ?? [];
	},

	async fetchDashboard() {
		isLoading = true;
		error = null;
		try {
			data = await reportsApi.getDashboard();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to fetch dashboard';
		} finally {
			isLoading = false;
		}
	},

	async refresh() {
		await this.fetchDashboard();
	},
};
