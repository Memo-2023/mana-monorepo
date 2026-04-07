import type { ModuleConfig } from '$lib/data/module-registry';

export const storageModuleConfig: ModuleConfig = {
	appId: 'storage',
	tables: [
		{ name: 'files' },
		{ name: 'storageFolders', syncName: 'folders' },
		{ name: 'fileTags' },
	],
};
