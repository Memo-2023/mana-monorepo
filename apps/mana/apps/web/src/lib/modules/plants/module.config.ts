import type { ModuleConfig } from '$lib/data/module-registry';

export const plantsModuleConfig: ModuleConfig = {
	appId: 'plants',
	tables: [
		{ name: 'plants' },
		{ name: 'plantPhotos' },
		{ name: 'wateringSchedules' },
		{ name: 'wateringLogs' },
		{ name: 'plantTags' },
	],
};
