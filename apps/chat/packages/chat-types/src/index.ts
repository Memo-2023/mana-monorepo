/**
 * Chat Types - Shared type definitions for the Chat application
 */

// Message Types
export interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

export interface Message {
	id: string;
	conversationId: string;
	sender: 'user' | 'assistant' | 'system';
	messageText: string;
	createdAt: string;
	updatedAt?: string;
}

// Conversation Types
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

// AI Model Types
export interface AIModelParameters {
	model?: string;
	temperature: number;
	maxTokens?: number;
	max_tokens?: number; // Legacy support
}

export interface AIModel {
	id: string;
	name: string;
	description?: string;
	provider: 'gemini' | 'azure' | 'openai';
	parameters: AIModelParameters;
	isActive: boolean;
	isDefault: boolean;
	createdAt?: string;
	updatedAt?: string;
}

// Token Usage Types
export interface TokenUsage {
	prompt_tokens: number;
	completion_tokens: number;
	total_tokens: number;
}

// API Response Types
export interface ChatCompletionResponse {
	content: string;
	usage: TokenUsage;
}

// Template Types
export interface Template {
	id: string;
	userId: string;
	name: string;
	description?: string;
	systemPrompt: string;
	initialQuestion?: string;
	modelId?: string;
	color: string;
	isDefault: boolean;
	documentMode: boolean;
	createdAt: string;
	updatedAt: string;
}

export type TemplateCreate = Omit<Template, 'id' | 'createdAt' | 'updatedAt'>;
export type TemplateUpdate = Partial<Omit<Template, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

// Space Types
export interface Space {
	id: string;
	name: string;
	description?: string;
	ownerId: string;
	isArchived: boolean;
	createdAt: string;
	updatedAt: string;
}

export type SpaceCreate = Pick<Space, 'name' | 'description' | 'ownerId'>;
export type SpaceUpdate = Partial<Pick<Space, 'name' | 'description' | 'isArchived'>>;

export interface SpaceMember {
	id: string;
	spaceId: string;
	userId: string;
	role: 'owner' | 'admin' | 'member' | 'viewer';
	invitationStatus: 'pending' | 'accepted' | 'declined';
	invitedBy?: string;
	invitedAt: string;
	joinedAt?: string;
	createdAt: string;
	updatedAt: string;
}

// Document Types
export interface Document {
	id: string;
	conversationId: string;
	content: string;
	version: number;
	createdAt: string;
	updatedAt: string;
}

export interface DocumentWithConversation extends Document {
	conversationTitle: string;
}
