/**
 * Guest seed data for the Chat app.
 *
 * Provides a demo conversation to showcase the chat experience.
 */

import type { LocalConversation, LocalMessage } from './local-store';

const DEMO_CONVERSATION_ID = 'demo-welcome';

export const guestConversations: LocalConversation[] = [
	{
		id: DEMO_CONVERSATION_ID,
		title: 'Willkommen bei Chat!',
		conversationMode: 'free',
		documentMode: false,
		isArchived: false,
		isPinned: true,
	},
];

export const guestMessages: LocalMessage[] = [
	{
		id: 'msg-1',
		conversationId: DEMO_CONVERSATION_ID,
		sender: 'assistant',
		messageText:
			'Hallo! Ich bin dein KI-Assistent. Du kannst mir Fragen stellen, Texte schreiben lassen oder einfach ein Gespräch führen. Melde dich an, um deine Unterhaltungen zu speichern und zu synchronisieren.',
	},
];
