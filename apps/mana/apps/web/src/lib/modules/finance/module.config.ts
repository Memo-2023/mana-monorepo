import type { ModuleConfig } from '$lib/data/module-registry';

export const financeModuleConfig: ModuleConfig = {
	appId: 'finance',
	tables: [
		{ name: 'transactions' },
		{ name: 'financeCategories', syncName: 'categories' },
		{ name: 'budgets' },
	],
};
