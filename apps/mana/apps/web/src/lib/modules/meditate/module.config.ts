import type { ModuleConfig } from '$lib/data/module-registry';

export const meditateModuleConfig: ModuleConfig = {
	appId: 'meditate',
	tables: [{ name: 'meditatePresets' }, { name: 'meditateSessions' }, { name: 'meditateSettings' }],
};
