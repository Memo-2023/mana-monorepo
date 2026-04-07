import type { ModuleConfig } from '$lib/data/module-registry';

export const chatModuleConfig: ModuleConfig = {
	appId: 'chat',
	tables: [
		{ name: 'conversations' },
		{ name: 'messages' },
		{ name: 'chatTemplates', syncName: 'templates' },
		{ name: 'conversationTags' },
	],
};
