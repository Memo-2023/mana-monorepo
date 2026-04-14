import type { ModuleConfig } from '$lib/data/module-registry';

export const foodModuleConfig: ModuleConfig = {
	appId: 'food',
	tables: [
		{ name: 'meals' },
		{ name: 'goals' },
		{ name: 'foodFavorites', syncName: 'favorites' },
		{ name: 'mealTags' },
	],
};
