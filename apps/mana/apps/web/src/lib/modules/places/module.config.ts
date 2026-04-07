import type { ModuleConfig } from '$lib/data/module-registry';

export const placesModuleConfig: ModuleConfig = {
	appId: 'places',
	tables: [{ name: 'places' }, { name: 'locationLogs' }, { name: 'placeTags' }],
};
