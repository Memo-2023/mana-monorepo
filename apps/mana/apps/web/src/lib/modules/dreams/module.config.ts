import type { ModuleConfig } from '$lib/data/module-registry';

export const dreamsModuleConfig: ModuleConfig = {
	appId: 'dreams',
	tables: [{ name: 'dreams' }, { name: 'dreamSymbols' }, { name: 'dreamTags' }],
};
