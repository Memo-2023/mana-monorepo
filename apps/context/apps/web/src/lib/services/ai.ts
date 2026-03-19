import { api } from '$lib/api/client';
import { estimateTokens } from '$lib/utils/text';
import { getCurrentTokenBalance } from './tokens';
import type {
	AIProvider,
	AIModelOption,
	AIGenerationOptions,
	AIGenerationResult,
	TokenCostEstimate,
} from '$lib/types';

export const availableModels: AIModelOption[] = [
	{ label: 'GPT-4.1', value: 'gpt-4.1', provider: 'azure' },
	{ label: 'Gemini Pro', value: 'gemini-pro', provider: 'google' },
	{ label: 'Gemini Flash', value: 'gemini-flash', provider: 'google' },
];

export const predefinedPrompts = [
	{
		title: 'Text fortsetzen',
		prompt: 'Setze den folgenden Text fort, behalte dabei den Stil und Ton bei:\n\n',
		icon: 'pencil',
		type: 'continuation' as const,
	},
	{
		title: 'Zusammenfassen',
		prompt: 'Fasse den folgenden Text prägnant zusammen:\n\n',
		icon: 'list',
		type: 'summary' as const,
	},
	{
		title: 'Umformulieren',
		prompt: 'Formuliere den folgenden Text um, behalte dabei den Inhalt bei:\n\n',
		icon: 'arrows-clockwise',
		type: 'rewrite' as const,
	},
	{
		title: 'Ideen generieren',
		prompt: 'Generiere Ideen zum folgenden Thema:\n\n',
		icon: 'lightbulb',
		type: 'ideas' as const,
	},
];

export type InsertionMode = 'append' | 'prepend' | 'replace' | 'new_version';

export async function checkTokenBalance(
	userId: string,
	prompt: string,
	model: string,
	estimatedCompletionLength: number = 500,
	referencedDocuments?: { title: string; content: string }[]
): Promise<{ hasEnough: boolean; estimate: TokenCostEstimate; balance: number }> {
	const { data, error } = await api.post<{
		hasEnough: boolean;
		estimate: TokenCostEstimate;
		balance: number;
	}>('/ai/estimate', {
		prompt,
		model,
		estimatedCompletionLength,
		referencedDocuments,
	});

	if (error || !data) {
		// Fallback: estimate locally
		let totalInputTokens = estimateTokens(prompt);
		if (referencedDocuments?.length) {
			const formattingOverhead = 20 + referencedDocuments.length * 10;
			totalInputTokens += formattingOverhead;
			referencedDocuments.forEach((doc) => {
				totalInputTokens += estimateTokens(doc.content || '');
			});
		}
		const balance = await getCurrentTokenBalance(userId);
		return {
			hasEnough: balance > 0,
			estimate: {
				inputTokens: totalInputTokens,
				outputTokens: estimatedCompletionLength,
				totalTokens: totalInputTokens + estimatedCompletionLength,
				costUsd: 0,
				appTokens: 1,
			},
			balance,
		};
	}

	return data;
}

export async function generateText(
	userId: string,
	prompt: string,
	provider: AIProvider = 'azure',
	options: AIGenerationOptions = {}
): Promise<AIGenerationResult> {
	const model = options.model || (provider === 'azure' ? 'gpt-4.1' : 'gemini-pro');

	const { data, error } = await api.post<{
		text: string;
		tokenInfo: {
			promptTokens: number;
			completionTokens: number;
			totalTokens: number;
			tokensUsed: number;
			remainingTokens: number;
		};
	}>('/ai/generate', {
		prompt,
		model,
		temperature: options.temperature,
		maxTokens: options.maxTokens,
		documentId: options.documentId,
		referencedDocuments: options.referencedDocuments,
	});

	if (error || !data) {
		throw new Error(error?.message || 'AI-Generierung fehlgeschlagen');
	}

	return {
		text: data.text,
		tokenInfo: data.tokenInfo,
	};
}

export function getProviderForModel(modelValue: string): AIProvider {
	const model = availableModels.find((m) => m.value === modelValue);
	return model?.provider || 'azure';
}
