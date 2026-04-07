import type { ModuleConfig } from '$lib/data/module-registry';

export const moodlitModuleConfig: ModuleConfig = {
	appId: 'moodlit',
	tables: [{ name: 'moods' }, { name: 'sequences' }, { name: 'moodTags' }],
};
