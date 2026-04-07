import type { ModuleConfig } from '$lib/data/module-registry';

export const habitsModuleConfig: ModuleConfig = {
	appId: 'habits',
	tables: [{ name: 'habits' }, { name: 'habitLogs' }],
};
