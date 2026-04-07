import type { ModuleConfig } from '$lib/data/module-registry';

export const photosModuleConfig: ModuleConfig = {
	appId: 'photos',
	tables: [
		{ name: 'albums' },
		{ name: 'albumItems' },
		{ name: 'photoFavorites', syncName: 'favorites' },
		{ name: 'photoMediaTags', syncName: 'photoTags' },
	],
};
