/**
 * Chat module — collection accessors and guest seed data.
 *
 * Table names: conversations, messages, chatTemplates
 */

import { db } from '$lib/data/database';
import type { LocalConversation, LocalMessage, LocalTemplate } from './types';

// ─── Collection Accessors ──────────────────────────────────

export const conversationTable = db.table<LocalConversation>('conversations');
export const messageTable = db.table<LocalMessage>('messages');
export const chatTemplateTable = db.table<LocalTemplate>('chatTemplates');

// ─── Guest Seed ────────────────────────────────────────────

const DEMO_CONVERSATION_ID = 'demo-welcome-chat';

export const CHAT_GUEST_SEED = {
	conversations: [
		{
			id: DEMO_CONVERSATION_ID,
			title: 'Willkommen bei ManaChat',
			conversationMode: 'free' as const,
			documentMode: false,
			isArchived: false,
			isPinned: true,
		},
	],
	messages: [
		{
			id: 'msg-welcome-1',
			conversationId: DEMO_CONVERSATION_ID,
			sender: 'assistant' as const,
			messageText:
				'Hallo! Ich bin dein KI-Assistent. Stelle mir eine Frage oder starte eine Unterhaltung.',
		},
	],
	chatTemplates: [] as Record<string, unknown>[],
};
