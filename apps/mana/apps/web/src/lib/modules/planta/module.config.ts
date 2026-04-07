import type { ModuleConfig } from '$lib/data/module-registry';

export const plantaModuleConfig: ModuleConfig = {
	appId: 'planta',
	tables: [
		{ name: 'plants' },
		{ name: 'plantPhotos' },
		{ name: 'wateringSchedules' },
		{ name: 'wateringLogs' },
		{ name: 'plantTags' },
	],
};
