import type { ModuleConfig } from '$lib/data/module-registry';

export const presiModuleConfig: ModuleConfig = {
	appId: 'presi',
	tables: [
		{ name: 'presiDecks', syncName: 'decks' },
		{ name: 'slides' },
		{ name: 'presiDeckTags' },
	],
};
