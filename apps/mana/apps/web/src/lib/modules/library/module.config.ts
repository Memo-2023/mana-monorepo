import type { ModuleConfig } from '$lib/data/module-registry';

export const libraryModuleConfig: ModuleConfig = {
	appId: 'library',
	tables: [{ name: 'libraryEntries' }],
};
