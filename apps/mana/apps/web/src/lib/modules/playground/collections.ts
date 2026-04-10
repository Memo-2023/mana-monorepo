/**
 * Playground module — collection accessors.
 *
 * Three tables: snippets (saved system prompts), conversations, and messages.
 */

import { db } from '$lib/data/database';
import type {
	LocalPlaygroundSnippet,
	LocalPlaygroundConversation,
	LocalPlaygroundMessage,
} from './types';

export const playgroundSnippetTable = db.table<LocalPlaygroundSnippet>('playgroundSnippets');
export const playgroundConversationTable =
	db.table<LocalPlaygroundConversation>('playgroundConversations');
export const playgroundMessageTable = db.table<LocalPlaygroundMessage>('playgroundMessages');
