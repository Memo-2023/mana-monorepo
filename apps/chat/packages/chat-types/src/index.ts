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
	conversation_id: string;
	sender: 'user' | 'assistant' | 'system';
	message_text: string;
	created_at: string;
	updated_at?: string;
}

// Conversation Types
export interface Conversation {
	id: string;
	user_id: string;
	model_id: string;
	template_id?: string;
	conversation_mode: 'free' | 'guided' | 'template';
	document_mode: boolean;
	title?: string;
	is_archived: boolean;
	created_at: string;
	updated_at: string;
}

// AI Model Types
export interface AIModelParameters {
	temperature: number;
	max_tokens: number;
	provider: 'azure' | 'openai';
	deployment: string;
	endpoint: string;
	api_version: string;
}

export interface AIModel {
	id: string;
	name: string;
	description: string;
	parameters: AIModelParameters;
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
	user_id: string;
	name: string;
	description: string | null;
	system_prompt: string;
	initial_question: string | null;
	model_id: string | null;
	color: string;
	is_default: boolean;
	document_mode: boolean;
	created_at: string;
	updated_at: string;
}

export type TemplateCreate = Omit<Template, 'id' | 'created_at' | 'updated_at'>;
export type TemplateUpdate = Partial<
	Omit<Template, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>;

// Space Types
export interface Space {
	id: string;
	name: string;
	description?: string;
	owner_id: string;
	is_archived: boolean;
	created_at: string;
	updated_at: string;
}

export type SpaceCreate = Pick<Space, 'name' | 'description' | 'owner_id'>;
export type SpaceUpdate = Partial<Pick<Space, 'name' | 'description' | 'is_archived'>>;

export interface SpaceMember {
	id: string;
	space_id: string;
	user_id: string;
	role: 'owner' | 'admin' | 'member' | 'viewer';
	invitation_status: 'pending' | 'accepted' | 'declined';
	invited_by?: string;
	invited_at: string;
	joined_at?: string;
	created_at: string;
	updated_at: string;
}

// Document Types
export interface Document {
	id: string;
	conversation_id: string;
	content: string;
	version: number;
	created_at: string;
	updated_at: string;
}

export interface DocumentWithConversation extends Document {
	conversation_title: string;
}
