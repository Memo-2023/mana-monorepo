import type { ModuleTool } from '$lib/data/tools/types';
import { conversationsStore } from './stores/conversations.svelte';

export const chatTools: ModuleTool[] = [
	{
		name: 'create_chat_conversation',
		module: 'chat',
		description: 'Erstellt ein neues AI-Chat-Gespraech',
		parameters: [{ name: 'title', type: 'string', description: 'Titel', required: false }],
		async execute(params) {
			const conv = await conversationsStore.create({ title: params.title as string | undefined });
			return { success: true, data: conv, message: `Chat "${conv.title || 'Neu'}" erstellt` };
		},
	},
];
