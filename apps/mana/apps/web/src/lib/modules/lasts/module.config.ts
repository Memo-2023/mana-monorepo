import type { ModuleConfig } from '$lib/data/module-registry';

export const lastsModuleConfig: ModuleConfig = {
	appId: 'lasts',
	tables: [{ name: 'lasts' }, { name: 'lastsCooldown' }],
};
