/**
 * Playground module types.
 *
 * Two persisted surfaces:
 *  1. **Snippets** — saved system-prompt templates (name, model, temperature)
 *  2. **Conversations** + **Messages** — full chat history that survives reload
 *
 * Conversations and messages are encrypted at rest (content, title, systemPrompt).
 */

import type { BaseRecord } from '@mana/local-store';

export interface LocalPlaygroundSnippet extends BaseRecord {
	/** User-given label, e.g. "JSON extractor" or "Tone of voice". */
	name: string;
	/** The actual system prompt text — the thing the user iterates on. */
	systemPrompt: string;
	/** Last model the snippet was used with. Used as the default when
	 *  the user clicks the snippet. */
	model: string;
	/** Last temperature the snippet was used with (0–2). */
	temperature: number;
	/** Pinned snippets sort to the top of the list. */
	isPinned?: boolean;
	/** Manual sort order within (pinned / unpinned) groups. */
	order?: number;
}

export interface PlaygroundSnippet {
	id: string;
	name: string;
	systemPrompt: string;
	model: string;
	temperature: number;
	isPinned: boolean;
	order: number;
	createdAt: string;
	updatedAt: string;
}

// ─── Conversations ──────────────────────────────────────

export interface LocalPlaygroundConversation extends BaseRecord {
	title: string | null;
	model: string;
	systemPrompt: string;
	temperature: number;
	snippetId: string | null;
	isPinned?: boolean;
	/** When non-null, the conversation is in comparison mode. */
	comparisonModels: string[] | null;
}

export interface PlaygroundConversation {
	id: string;
	title: string | null;
	model: string;
	systemPrompt: string;
	temperature: number;
	snippetId: string | null;
	isPinned: boolean;
	comparisonModels: string[] | null;
	createdAt: string;
	updatedAt: string;
}

// ─── Messages ───────────────────────────────────────────

export interface LocalPlaygroundMessage extends BaseRecord {
	conversationId: string;
	role: 'user' | 'assistant' | 'system';
	content: string;
	/** Which model produced this response (null for user messages). */
	model: string | null;
	promptTokens: number | null;
	completionTokens: number | null;
	/** Ties together N assistant responses from a single comparison round. */
	comparisonGroupId: string | null;
	order: number;
}

export interface PlaygroundConversationMessage {
	id: string;
	conversationId: string;
	role: 'user' | 'assistant' | 'system';
	content: string;
	model: string | null;
	promptTokens: number | null;
	completionTokens: number | null;
	comparisonGroupId: string | null;
	order: number;
	createdAt: string;
}
