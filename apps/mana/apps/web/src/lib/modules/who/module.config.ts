import type { ModuleConfig } from '$lib/data/module-registry';

export const whoModuleConfig: ModuleConfig = {
	appId: 'who',
	tables: [
		{ name: 'whoGames', syncName: 'games' },
		{ name: 'whoMessages', syncName: 'messages' },
	],
};
