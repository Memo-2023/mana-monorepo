import type { ModuleConfig } from '$lib/data/module-registry';

export const moodModuleConfig: ModuleConfig = {
	appId: 'mood',
	tables: [{ name: 'moodEntries' }, { name: 'moodSettings' }],
};
