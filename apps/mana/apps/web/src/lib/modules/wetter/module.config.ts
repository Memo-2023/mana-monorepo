import type { ModuleConfig } from '$lib/data/module-registry';

export const wetterModuleConfig: ModuleConfig = {
	appId: 'wetter',
	tables: [
		{ name: 'wetterLocations', syncName: 'locations' },
		{ name: 'wetterSettings', syncName: 'settings' },
	],
};
