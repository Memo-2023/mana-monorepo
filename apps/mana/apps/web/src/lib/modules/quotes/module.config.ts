import type { ModuleConfig } from '$lib/data/module-registry';

export const quotesModuleConfig: ModuleConfig = {
	appId: 'quotes',
	tables: [
		{ name: 'quotesFavorites', syncName: 'favorites' },
		{ name: 'quotesLists', syncName: 'lists' },
		{ name: 'quotesListTags' },
		{ name: 'customQuotes', syncName: 'custom-quotes' },
	],
};
