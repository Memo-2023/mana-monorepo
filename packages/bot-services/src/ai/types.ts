/**
 * AI/Ollama service types
 */

/**
 * Ollama model info
 */
export interface OllamaModel {
	name: string;
	size: number;
	modified_at: string;
	digest?: string;
	details?: {
		format: string;
		family: string;
		parameter_size: string;
		quantization_level: string;
	};
}

/**
 * Chat message
 */
export interface ChatMessage {
	role: 'user' | 'assistant' | 'system';
	content: string;
	images?: string[]; // Base64 encoded images for vision
}

/**
 * Chat completion options
 */
export interface ChatOptions {
	model?: string;
	temperature?: number;
	maxTokens?: number;
	systemPrompt?: string;
}

/**
 * Chat response metadata
 */
export interface ChatResponseMeta {
	model: string;
	evalCount?: number;
	evalDuration?: number;
	tokensPerSecond?: number;
}

/**
 * Chat completion result
 */
export interface ChatResult {
	content: string;
	meta: ChatResponseMeta;
}

/**
 * AI service configuration
 */
export interface AiServiceConfig {
	baseUrl: string;
	defaultModel: string;
	timeout: number;
}

/**
 * User AI session (for conversation history)
 */
export interface UserAiSession {
	systemPrompt: string;
	model: string;
	history: ChatMessage[];
	pendingImage?: {
		url: string;
		mimeType: string;
		base64?: string;
	};
}

/**
 * System prompt presets
 */
export interface SystemPromptPreset {
	name: string;
	prompt: string;
	description: string;
}

/**
 * Default system prompts
 */
export const SYSTEM_PROMPTS: Record<string, string> = {
	default: `Du bist Manai, ein freundlicher und hilfreicher KI-Assistent.
Du antwortest auf Deutsch, es sei denn, der Nutzer schreibt auf Englisch.
Du bist präzise, hilfreich und freundlich.
Halte deine Antworten kompakt, aber informativ.`,

	code: `Du bist ein erfahrener Software-Entwickler und Code-Assistent.
Du hilfst beim Schreiben, Debuggen und Erklären von Code.
Gib klare, gut kommentierte Code-Beispiele.
Erkläre technische Konzepte verständlich.`,

	translate: `Du bist ein professioneller Übersetzer.
Übersetze Texte präzise und natürlich klingend.
Bewahre den Stil und Ton des Originals.
Bei Unklarheiten frage nach der gewünschten Zielsprache.`,

	summarize: `Du bist ein Experte für das Zusammenfassen von Texten.
Erstelle klare, prägnante Zusammenfassungen.
Behalte die wichtigsten Punkte bei.
Strukturiere die Zusammenfassung übersichtlich.`,

	creative: `Du bist ein kreativer Schreibassistent.
Hilf beim Verfassen von Geschichten, Gedichten und kreativen Texten.
Sei fantasievoll und inspirierend.
Passe deinen Stil an die gewünschte Textart an.`,
};

/**
 * Vision-capable model names
 */
export const VISION_MODELS = ['llava', 'llava:7b', 'llava:13b', 'bakllava', 'moondream'];

/**
 * Ollama API response types
 */
export interface OllamaVersionResponse {
	version: string;
}

export interface OllamaTagsResponse {
	models: OllamaModel[];
}

export interface OllamaChatResponse {
	model: string;
	message?: {
		role: string;
		content: string;
	};
	eval_count?: number;
	eval_duration?: number;
	total_duration?: number;
	load_duration?: number;
	prompt_eval_count?: number;
}

/**
 * Models excluded from comparison (specialized, not for general chat)
 */
export const NON_CHAT_MODELS = ['deepseek-r1:1.5b'];
