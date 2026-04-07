import type { ModuleConfig } from '$lib/data/module-registry';

export const skilltreeModuleConfig: ModuleConfig = {
	appId: 'skilltree',
	tables: [
		{ name: 'skills' },
		{ name: 'activities' },
		{ name: 'achievements' },
		{ name: 'skillTags' },
	],
};
