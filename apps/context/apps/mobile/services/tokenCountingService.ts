import { tokensApi, type ModelPrice } from './backendApi';

// Re-export types for backward compatibility
export type { ModelPrice };

export type TokenCostEstimate = {
	inputTokens: number;
	outputTokens: number;
	totalTokens: number;
	costUsd: number;
	appTokens: number;
	basePromptTokens?: number;
	documentTokens?: number;
};

/**
 * Schätzt die Anzahl der Tokens in einem Text
 * Diese Schätzung ist nicht exakt, aber ausreichend für eine grobe Kostenschätzung
 * Für GPT-Modelle wird durchschnittlich 1 Token pro 4 Zeichen angenommen
 */
export const estimateTokens = (text: string): number => {
	try {
		if (!text) return 0;
		if (typeof text !== 'string') {
			console.warn('estimateTokens: Ungültiger Text-Typ:', typeof text);
			return 0;
		}

		// Einfache Schätzung: 1 Token pro 4 Zeichen (für englischen Text)
		const estimatedTokens = Math.ceil(text.length / 4);
		return estimatedTokens;
	} catch (error) {
		console.error('Fehler bei der Token-Schätzung:', error);
		return 1;
	}
};

/**
 * Holt die Preisdaten für alle Modelle vom Backend
 */
export const getModelPrices = async (): Promise<ModelPrice[]> => {
	return tokensApi.getModels();
};

/**
 * Schätzt die Kosten für einen Prompt und eine erwartete Antwortlänge
 * NOTE: For accurate estimates, prefer using aiApi.estimate() which runs server-side
 */
export const estimateCostForPrompt = async (
	prompt: string,
	model: string,
	estimatedCompletionLength: number = 500
): Promise<TokenCostEstimate> => {
	const promptTokens = estimateTokens(prompt);
	const completionTokens = estimatedCompletionLength;

	// Use default pricing for local estimation
	const inputPricePer1kTokens = 0.01;
	const outputPricePer1kTokens = 0.03;
	const tokensPerDollar = 50000;

	const inputCost = (promptTokens / 1000) * inputPricePer1kTokens;
	const outputCost = (completionTokens / 1000) * outputPricePer1kTokens;
	const totalCostUsd = inputCost + outputCost;
	const appTokens = Math.max(1, Math.ceil(totalCostUsd * tokensPerDollar));

	return {
		inputTokens: promptTokens,
		outputTokens: completionTokens,
		totalTokens: promptTokens + completionTokens,
		costUsd: totalCostUsd,
		appTokens,
	};
};

/**
 * Berechnet die Token-Anzahl für ein Dokument und aktualisiert die Metadaten
 * Diese Funktion sollte beim Erstellen oder Aktualisieren eines Dokuments aufgerufen werden
 */
export const updateDocumentTokenCount = (document: {
	content: string | null;
	metadata: any;
}): { metadata: any; tokenCount: number } => {
	const metadata = document.metadata || {};
	const tokenCount = estimateTokens(document.content || '');
	metadata.token_count = tokenCount;
	return { metadata, tokenCount };
};
