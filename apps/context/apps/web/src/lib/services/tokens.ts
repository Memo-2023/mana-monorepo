import { api } from '$lib/api/client';
import { estimateTokens } from '$lib/utils/text';
import type { TokenCostEstimate } from '$lib/types';

export interface TokenTransaction {
	id: string;
	user_id: string;
	amount: number;
	transaction_type: string;
	model_used?: string;
	prompt_tokens?: number;
	completion_tokens?: number;
	total_tokens?: number;
	cost_usd?: number;
	document_id?: string;
	created_at: string;
}

export interface TokenUsageStats {
	totalUsed: number;
	byModel: Record<string, number>;
	byDate: Record<string, number>;
}

export interface ModelPrice {
	model_name: string;
	input_price_per_1k_tokens: number;
	output_price_per_1k_tokens: number;
	tokens_per_dollar: number;
}

export async function getCurrentTokenBalance(userId: string): Promise<number> {
	const { data, error } = await api.get<{ balance: number }>('/tokens/balance');
	if (error || !data) return 0;
	return data.balance;
}

export async function hasEnoughTokens(userId: string, requiredTokens: number): Promise<boolean> {
	const balance = await getCurrentTokenBalance(userId);
	return balance >= requiredTokens;
}

export async function getModelPrice(modelName: string): Promise<ModelPrice | null> {
	const { data, error } = await api.get<{ models: ModelPrice[] }>('/tokens/models');
	if (error || !data) return null;
	return data.models.find((m) => m.model_name === modelName) || null;
}

export async function calculateCost(
	model: string,
	promptTokens: number,
	completionTokens: number
): Promise<TokenCostEstimate> {
	let inputPricePer1k = 0.01;
	let outputPricePer1k = 0.03;
	let tokensPerDollar = 50000;

	const modelPrice = await getModelPrice(model);
	if (modelPrice) {
		inputPricePer1k = modelPrice.input_price_per_1k_tokens;
		outputPricePer1k = modelPrice.output_price_per_1k_tokens;
		tokensPerDollar = modelPrice.tokens_per_dollar;
	}

	const inputCost = (promptTokens / 1000) * inputPricePer1k;
	const outputCost = (completionTokens / 1000) * outputPricePer1k;
	const totalCostUsd = inputCost + outputCost;
	const appTokens = Math.max(1, Math.ceil(totalCostUsd * tokensPerDollar));

	return {
		inputTokens: promptTokens,
		outputTokens: completionTokens,
		totalTokens: promptTokens + completionTokens,
		costUsd: totalCostUsd,
		appTokens,
	};
}

export async function estimateCostForPrompt(
	prompt: string,
	model: string,
	estimatedCompletionLength: number = 500
): Promise<TokenCostEstimate> {
	const promptTokens = estimateTokens(prompt);
	return calculateCost(model, promptTokens, estimatedCompletionLength);
}

export async function logTokenUsage(
	userId: string,
	model: string,
	prompt: string,
	completion: string,
	documentId?: string
): Promise<boolean> {
	// Token logging is now handled server-side by the AI endpoint
	return true;
}

export async function getTokenUsageStats(
	userId: string,
	timeframe: 'day' | 'week' | 'month' | 'year'
): Promise<TokenUsageStats> {
	const { data, error } = await api.get<{ stats: TokenUsageStats }>(
		`/tokens/stats?timeframe=${timeframe}`
	);

	if (error || !data) {
		return { totalUsed: 0, byModel: {}, byDate: {} };
	}
	return data.stats;
}

export async function getTokenTransactions(
	userId: string,
	limit: number = 20,
	offset: number = 0
): Promise<TokenTransaction[]> {
	const { data, error } = await api.get<{ transactions: TokenTransaction[] }>(
		`/tokens/transactions?limit=${limit}&offset=${offset}`
	);

	if (error || !data) return [];
	return data.transactions;
}
