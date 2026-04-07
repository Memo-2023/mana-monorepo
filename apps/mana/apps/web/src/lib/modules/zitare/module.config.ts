import type { ModuleConfig } from '$lib/data/module-registry';

export const zitareModuleConfig: ModuleConfig = {
	appId: 'zitare',
	tables: [
		{ name: 'zitareFavorites', syncName: 'favorites' },
		{ name: 'zitareLists', syncName: 'lists' },
		{ name: 'zitareListTags' },
	],
};
