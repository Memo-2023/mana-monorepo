import type { ModuleConfig } from '$lib/data/module-registry';

export const inventoryModuleConfig: ModuleConfig = {
	appId: 'inventory',
	tables: [
		{ name: 'invCollections', syncName: 'collections' },
		{ name: 'invItems', syncName: 'items' },
		{ name: 'invLocations', syncName: 'locations' },
		{ name: 'invCategories', syncName: 'categories' },
		{ name: 'invItemTags' },
	],
};
