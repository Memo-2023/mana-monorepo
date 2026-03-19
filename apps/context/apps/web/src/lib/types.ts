export type DocumentType = 'text' | 'context' | 'prompt';

export interface DocumentMetadata {
	tags?: string[];
	word_count?: number;
	token_count?: number;
	parent_document?: string;
	version?: number;
	generation_type?: 'summary' | 'continuation' | 'rewrite' | 'ideas';
	model_used?: string;
	prompt_used?: string;
	original_title?: string;
	version_history?: Array<{
		id: string;
		title: string;
		type: string;
		created_at: string;
		is_original: boolean;
	}>;
	[key: string]: unknown;
}

export interface Document {
	id: string;
	title: string;
	content: string | null;
	type: DocumentType;
	space_id: string | null;
	user_id: string;
	created_at: string;
	updated_at: string;
	metadata: DocumentMetadata | null;
	short_id?: string;
	pinned?: boolean;
}

export interface Space {
	id: string;
	name: string;
	description: string | null;
	user_id: string;
	created_at: string;
	settings: Record<string, unknown> | null;
	pinned: boolean;
	prefix?: string;
	text_doc_counter?: number;
	context_doc_counter?: number;
	prompt_doc_counter?: number;
}

export type AIProvider = 'azure' | 'google';

export interface AIModelOption {
	label: string;
	value: string;
	provider: AIProvider;
}

export interface AIGenerationOptions {
	model?: string;
	temperature?: number;
	maxTokens?: number;
	prompt?: string;
	documentId?: string;
	referencedDocuments?: { title: string; content: string }[];
}

export interface AIGenerationResult {
	text: string;
	tokenInfo: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
		tokensUsed: number;
		remainingTokens: number;
	};
}

export interface TokenCostEstimate {
	inputTokens: number;
	outputTokens: number;
	totalTokens: number;
	costUsd: number;
	appTokens: number;
	basePromptTokens?: number;
	documentTokens?: number;
}
