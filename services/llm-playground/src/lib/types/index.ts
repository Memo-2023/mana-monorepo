export interface Message {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

export interface ChatCompletionRequest {
	model: string;
	messages: Message[];
	temperature?: number;
	max_tokens?: number;
	top_p?: number;
	stream?: boolean;
}

export interface ChatCompletionChoice {
	index: number;
	message: Message;
	finish_reason: string | null;
}

export interface ChatCompletionResponse {
	id: string;
	object: string;
	created: number;
	model: string;
	choices: ChatCompletionChoice[];
	usage?: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
}

export interface StreamDelta {
	role?: string;
	content?: string;
}

export interface StreamChoice {
	index: number;
	delta: StreamDelta;
	finish_reason: string | null;
}

export interface StreamChunk {
	id: string;
	object: string;
	created: number;
	model: string;
	choices: StreamChoice[];
}

export interface Model {
	id: string;
	object: string;
	created: number;
	owned_by: string;
}

export interface ModelsResponse {
	object: string;
	data: Model[];
}

export interface HealthResponse {
	status: string;
	timestamp: string;
	version?: string;
}

export interface ChatMessage {
	id: string;
	role: 'user' | 'assistant';
	content: string;
	timestamp: Date;
	model?: string;
	isStreaming?: boolean;
}

export interface Settings {
	model: string;
	temperature: number;
	maxTokens: number;
	topP: number;
	systemPrompt: string;
}

export type Provider = 'ollama' | 'openrouter' | 'groq' | 'together';

// Modality types for model comparison
export type Modality = 'text' | 'vision' | 'code';

export interface ModelWithModality extends Model {
	modality: Modality;
	description?: string;
}

// Comparison response from a single model
export interface ComparisonResponse {
	modelId: string;
	content: string;
	isStreaming: boolean;
	startTime: number;
	endTime?: number;
	metrics?: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
		durationMs: number;
		tokensPerSecond: number;
	};
	error?: string;
}

// Comparison message containing multiple model responses
export interface ComparisonMessage {
	id: string;
	role: 'comparison';
	userContent: string;
	responses: ComparisonResponse[];
	timestamp: Date;
}

// Union type for all message types
export type AnyMessage = ChatMessage | ComparisonMessage;
