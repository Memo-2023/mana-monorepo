import * as tokensService from '$lib/services/tokens';
import type { TokenUsageStats } from '$lib/services/tokens';

let balance = $state(0);
let loading = $state(false);
let stats = $state<TokenUsageStats | null>(null);
let transactions = $state<tokensService.TokenTransaction[]>([]);
let timeframe = $state<'day' | 'week' | 'month' | 'year'>('month');

export const tokensStore = {
	get balance() {
		return balance;
	},
	get loading() {
		return loading;
	},
	get stats() {
		return stats;
	},
	get transactions() {
		return transactions;
	},
	get timeframe() {
		return timeframe;
	},

	async loadBalance(userId: string) {
		balance = await tokensService.getCurrentTokenBalance(userId);
	},

	async loadStats(userId: string) {
		loading = true;
		try {
			stats = await tokensService.getTokenUsageStats(userId, timeframe);
		} finally {
			loading = false;
		}
	},

	async loadTransactions(userId: string) {
		transactions = await tokensService.getTokenTransactions(userId);
	},

	async loadAll(userId: string) {
		loading = true;
		try {
			await Promise.all([
				this.loadBalance(userId),
				this.loadStats(userId),
				this.loadTransactions(userId),
			]);
		} finally {
			loading = false;
		}
	},

	setTimeframe(tf: 'day' | 'week' | 'month' | 'year') {
		timeframe = tf;
	},

	updateBalance(newBalance: number) {
		balance = newBalance;
	},
};
