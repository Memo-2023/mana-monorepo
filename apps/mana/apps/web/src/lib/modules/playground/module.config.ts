import type { ModuleConfig } from '$lib/data/module-registry';

export const playgroundModuleConfig: ModuleConfig = {
	appId: 'playground',
	tables: [
		{ name: 'playgroundSnippets', syncName: 'snippets' },
		{ name: 'playgroundConversations', syncName: 'conversations' },
		{ name: 'playgroundMessages', syncName: 'messages' },
	],
};
