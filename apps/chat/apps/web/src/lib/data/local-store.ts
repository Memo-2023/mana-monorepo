/**
 * Chat — Local-First Data Layer
 *
 * Conversations, messages, and templates stored locally.
 * LLM streaming and model management remain server-side.
 */

import { createLocalStore, type BaseRecord } from '@manacore/local-store';
import { guestConversations, guestMessages } from './guest-seed';

// ─── Types ──────────────────────────────────────────────────

export interface LocalConversation extends BaseRecord {
	title?: string | null;
	modelId?: string | null;
	templateId?: string | null;
	spaceId?: string | null;
	conversationMode: 'free' | 'guided' | 'template';
	documentMode: boolean;
	isArchived: boolean;
	isPinned: boolean;
}

export interface LocalMessage extends BaseRecord {
	conversationId: string;
	sender: 'user' | 'assistant' | 'system';
	messageText: string;
}

export interface LocalTemplate extends BaseRecord {
	name: string;
	description: string;
	systemPrompt: string;
	initialQuestion?: string | null;
	modelId?: string | null;
	color: string;
	isDefault: boolean;
	documentMode: boolean;
}

// ─── Store ──────────────────────────────────────────────────

const SYNC_SERVER_URL = import.meta.env.PUBLIC_SYNC_SERVER_URL || 'http://localhost:3050';

export const chatStore = createLocalStore({
	appId: 'chat',
	collections: [
		{
			name: 'conversations',
			indexes: ['isArchived', 'isPinned', 'spaceId', 'templateId'],
			guestSeed: guestConversations,
		},
		{
			name: 'messages',
			indexes: ['conversationId', 'sender', '[conversationId+sender]'],
			guestSeed: guestMessages,
		},
		{
			name: 'templates',
			indexes: ['isDefault'],
		},
	],
	sync: {
		serverUrl: SYNC_SERVER_URL,
	},
});

// Typed collection accessors
export const conversationCollection = chatStore.collection<LocalConversation>('conversations');
export const messageCollection = chatStore.collection<LocalMessage>('messages');
export const templateCollection = chatStore.collection<LocalTemplate>('templates');
