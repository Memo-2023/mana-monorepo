import type { ModuleConfig } from '$lib/data/module-registry';

export const broadcastModuleConfig: ModuleConfig = {
	appId: 'broadcasts',
	tables: [
		{ name: 'broadcastCampaigns' },
		{ name: 'broadcastTemplates' },
		{ name: 'broadcastSettings' },
	],
};
