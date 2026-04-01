/**
 * Chat module types for the unified app.
 */

import type { BaseRecord } from '@manacore/local-store';

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

// ─── View Types (used in UI, decoupled from local-store BaseRecord) ───

export interface Conversation {
	id: string;
	userId: string;
	modelId: string;
	templateId?: string;
	spaceId?: string;
	conversationMode: 'free' | 'guided' | 'template';
	documentMode: boolean;
	title?: string;
	isArchived: boolean;
	isPinned: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface Message {
	id: string;
	conversationId: string;
	sender: 'user' | 'assistant' | 'system';
	messageText: string;
	createdAt: string;
	updatedAt?: string;
}

export interface Template {
	id: string;
	userId: string;
	name: string;
	description: string | null;
	systemPrompt: string;
	initialQuestion?: string | null;
	modelId?: string | null;
	color: string;
	isDefault: boolean;
	documentMode: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface AIModel {
	id: string;
	name: string;
	provider: string;
	description?: string;
	isDefault?: boolean;
	isLocal?: boolean;
}

export interface ChatMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
}
