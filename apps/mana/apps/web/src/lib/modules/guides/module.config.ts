import type { ModuleConfig } from '$lib/data/module-registry';

export const guidesModuleConfig: ModuleConfig = {
	appId: 'guides',
	tables: [
		{ name: 'guides' },
		{ name: 'sections' },
		{ name: 'steps' },
		{ name: 'guideCollections', syncName: 'collections' },
		{ name: 'runs' },
		{ name: 'guideTags' },
	],
};
