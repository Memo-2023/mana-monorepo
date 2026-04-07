import type { ModuleConfig } from '$lib/data/module-registry';

export const inventarModuleConfig: ModuleConfig = {
	appId: 'inventar',
	tables: [
		{ name: 'invCollections', syncName: 'collections' },
		{ name: 'invItems', syncName: 'items' },
		{ name: 'invLocations', syncName: 'locations' },
		{ name: 'invCategories', syncName: 'categories' },
		{ name: 'invItemTags' },
	],
};
