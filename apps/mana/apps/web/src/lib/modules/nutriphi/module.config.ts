import type { ModuleConfig } from '$lib/data/module-registry';

export const nutriphiModuleConfig: ModuleConfig = {
	appId: 'nutriphi',
	tables: [
		{ name: 'meals' },
		{ name: 'goals' },
		{ name: 'nutriFavorites', syncName: 'favorites' },
		{ name: 'mealTags' },
	],
};
