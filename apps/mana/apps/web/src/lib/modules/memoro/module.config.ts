import type { ModuleConfig } from '$lib/data/module-registry';

export const memoroModuleConfig: ModuleConfig = {
	appId: 'memoro',
	tables: [
		{ name: 'memos' },
		{ name: 'memories' },
		{ name: 'memoTags' },
		{ name: 'memoroSpaces', syncName: 'spaces' },
		{ name: 'spaceMembers' },
		{ name: 'memoSpaces' },
	],
};
