import type { ModuleConfig } from '$lib/data/module-registry';

export const drinkModuleConfig: ModuleConfig = {
	appId: 'drink',
	tables: [{ name: 'drinkEntries' }, { name: 'drinkPresets' }],
};
