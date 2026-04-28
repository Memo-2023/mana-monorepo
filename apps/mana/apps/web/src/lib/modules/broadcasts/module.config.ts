import type { ModuleConfig } from '$lib/data/module-registry';

export const broadcastModuleConfig: ModuleConfig = {
	appId: 'broadcast',
	tables: [
		{ name: 'broadcastCampaigns' },
		{ name: 'broadcastTemplates' },
		{ name: 'broadcastSettings' },
	],
};
