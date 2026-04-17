import type { ModuleConfig } from '$lib/data/module-registry';

export const wishesModuleConfig: ModuleConfig = {
	appId: 'wishes',
	tables: [
		{ name: 'wishesItems', syncName: 'items' },
		{ name: 'wishesLists', syncName: 'lists' },
		{ name: 'wishesPriceChecks', syncName: 'priceChecks' },
	],
};
