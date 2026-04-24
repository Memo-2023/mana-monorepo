import type { ModuleConfig } from '$lib/data/module-registry';

export const writingModuleConfig: ModuleConfig = {
	appId: 'writing',
	tables: [
		{ name: 'writingDrafts' },
		{ name: 'writingDraftVersions' },
		{ name: 'writingGenerations' },
		{ name: 'writingStyles' },
	],
};
