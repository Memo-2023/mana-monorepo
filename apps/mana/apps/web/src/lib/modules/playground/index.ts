/**
 * Playground module — barrel exports.
 *
 * LLM playground for testing prompts against different models with
 * persistent chat history, token tracking, and model comparison.
 */

export const PLAYGROUND_MODELS = [
	{ id: 'claude-sonnet', label: 'Claude Sonnet', provider: 'Anthropic' },
	{ id: 'claude-haiku', label: 'Claude Haiku', provider: 'Anthropic' },
	{ id: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
	{ id: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI' },
	{ id: 'gemini-pro', label: 'Gemini Pro', provider: 'Google' },
	{ id: 'gemini-flash', label: 'Gemini Flash', provider: 'Google' },
] as const;

export type PlaygroundModel = (typeof PLAYGROUND_MODELS)[number]['id'];

export interface PlaygroundMessage {
	role: 'user' | 'assistant';
	content: string;
	timestamp: number;
}
