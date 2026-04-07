import type { ModuleConfig } from '$lib/data/module-registry';

export const contextModuleConfig: ModuleConfig = {
	appId: 'context',
	tables: [
		{ name: 'contextSpaces', syncName: 'spaces' },
		{ name: 'documents' },
		{ name: 'documentTags' },
	],
};
