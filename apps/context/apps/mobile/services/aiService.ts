import { supabase } from '../utils/supabase';

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

const BACKEND_URL =
	process.env.EXPO_PUBLIC_BACKEND_URL ||
	process.env.EXPO_PUBLIC_CONTEXT_BACKEND_URL ||
	'http://localhost:3020';

/**
 * Get the current Supabase access token for backend auth
 */
const getAuthToken = async (): Promise<string> => {
	const { data } = await supabase.auth.getSession();
	const token = data?.session?.access_token;
	if (!token) {
		throw new Error('Nicht angemeldet');
	}
	return token;
};

/**
 * Get the current user ID from Supabase session
 */
const getUserId = async (): Promise<string> => {
	const { data } = await supabase.auth.getSession();
	const userId = data?.session?.user?.id;
	if (!userId) {
		throw new Error('Nicht angemeldet');
	}
	return userId;
};

/**
 * Prüft, ob der Benutzer genügend Tokens für eine Anfrage hat
 */
export const checkTokenBalance = async (
	prompt: string,
	model: string,
	estimatedCompletionLength: number = 500,
	referencedDocuments?: { title: string; content: string }[]
): Promise<{ hasEnough: boolean; estimate: any; balance: number }> => {
	try {
		const token = await getAuthToken();

		const response = await fetch(`${BACKEND_URL}/api/v1/ai/estimate/mobile`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				prompt,
				model,
				estimatedCompletionLength,
				referencedDocuments,
			}),
		});

		if (!response.ok) {
			throw new Error(`Backend error: ${response.status}`);
		}

		const data = await response.json();
		return {
			hasEnough: data.hasEnough,
			estimate: data.estimate,
			balance: data.balance,
		};
	} catch (error) {
		console.error('Fehler beim Prüfen des Token-Guthabens:', error);
		return { hasEnough: false, estimate: null, balance: 0 };
	}
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
		const token = await getAuthToken();

		const response = await fetch(`${BACKEND_URL}/api/v1/ai/generate/mobile`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({
				prompt,
				model: options.model || 'ollama/gemma3:4b',
				temperature: options.temperature,
				maxTokens: options.maxTokens,
				documentId: options.documentId,
				referencedDocuments: options.referencedDocuments,
			}),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.message || `Backend error: ${response.status}`);
		}

		const result = await response.json();

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
