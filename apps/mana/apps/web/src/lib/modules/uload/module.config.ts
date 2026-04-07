import type { ModuleConfig } from '$lib/data/module-registry';

export const uloadModuleConfig: ModuleConfig = {
	appId: 'uload',
	tables: [
		{ name: 'links' },
		{ name: 'uloadTags', syncName: 'tags' },
		{ name: 'uloadFolders', syncName: 'folders' },
		{ name: 'linkTags' },
	],
};
