import type { ModuleConfig } from '$lib/data/module-registry';

export const pictureModuleConfig: ModuleConfig = {
	appId: 'picture',
	tables: [{ name: 'images' }, { name: 'boards' }, { name: 'boardItems' }, { name: 'imageTags' }],
};
