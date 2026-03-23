import { aiApi } from './backendApi';

// Typdefinitionen
export type AIProvider = 'azure' | 'google';

export type AIModelOption = {
	label: string;
	value: string;
	provider: AIProvider;
};

export type AIGenerationOptions = {
	model?: string;
	temperature?: number;
	maxTokens?: number;
	prompt?: string;
	documentId?: string;
	referencedDocuments?: { title: string; content: string }[];
};

export type AIGenerationResult = {
	text: string;
	tokenInfo: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
		tokensUsed: number;
		remainingTokens: number;
	};
};

// Verfügbare Modelle (routed through mana-llm on the backend)
export const availableModels: AIModelOption[] = [
	{ label: 'Gemma 3 4B (Lokal)', value: 'ollama/gemma3:4b', provider: 'azure' },
	{
		label: 'Llama 3.1 8B',
		value: 'openrouter/meta-llama/llama-3.1-8b-instruct',
		provider: 'azure',
	},
];

/**
 * Prüft, ob der Benutzer genügend Tokens für eine Anfrage hat
 */
export const checkTokenBalance = async (
	prompt: string,
	model: string,
	estimatedCompletionLength: number = 500,
	referencedDocuments?: { title: string; content: string }[]
): Promise<{ hasEnough: boolean; estimate: any; balance: number }> => {
	return aiApi.estimate({
		prompt,
		model,
		estimatedCompletionLength,
		referencedDocuments,
	});
};

/**
 * Generiert Text über das Backend (welches mana-llm nutzt)
 */
export const generateText = async (
	prompt: string,
	_provider: AIProvider = 'azure',
	options: AIGenerationOptions = {}
): Promise<AIGenerationResult> => {
	try {
		const result = await aiApi.generate({
			prompt,
			model: options.model || 'ollama/gemma3:4b',
			temperature: options.temperature,
			maxTokens: options.maxTokens,
			documentId: options.documentId,
			referencedDocuments: options.referencedDocuments,
		});

		return {
			text: result.text,
			tokenInfo: result.tokenInfo,
		};
	} catch (error: any) {
		console.error('Fehler bei der Textgenerierung:', error);
		throw new Error(`Textgenerierung fehlgeschlagen: ${error.message}`);
	}
};

/**
 * Hilfsfunktion zum Abrufen von Modelloptionen für einen bestimmten Provider
 */
export const getModelsByProvider = (_provider: AIProvider): AIModelOption[] => {
	return availableModels;
};

/**
 * Hilfsfunktion zum Abrufen des Providers für ein bestimmtes Modell
 */
export const getProviderForModel = (_modelValue: string): AIProvider => {
	return 'azure';
};
