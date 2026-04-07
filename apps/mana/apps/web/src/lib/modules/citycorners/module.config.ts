import type { ModuleConfig } from '$lib/data/module-registry';

export const citycornersModuleConfig: ModuleConfig = {
	appId: 'citycorners',
	tables: [
		{ name: 'cities' },
		{ name: 'ccLocations', syncName: 'locations' },
		{ name: 'ccFavorites', syncName: 'favorites' },
		{ name: 'ccLocationTags' },
	],
};
