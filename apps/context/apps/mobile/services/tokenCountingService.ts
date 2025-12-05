import { supabase } from '../utils/supabase';

// Typdefinitionen
export type ModelPrice = {
	id: string;
	model_name: string;
	input_price_per_1k_tokens: number;
	output_price_per_1k_tokens: number;
	tokens_per_dollar: number;
	created_at: string;
	updated_at: string;
};

export type TokenCostEstimate = {
	inputTokens: number;
	outputTokens: number;
	totalTokens: number;
	costUsd: number;
	appTokens: number;
	// Neue Felder für die detaillierte Token-Aufschlüsselung
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
		// Prüfe, ob der Text gültig ist
		if (!text) return 0;
		if (typeof text !== 'string') {
			console.warn('estimateTokens: Ungültiger Text-Typ:', typeof text);
			return 0;
		}

		// Debugging-Ausgabe
		console.log(`estimateTokens: Text-Länge = ${text.length} Zeichen`);

		// Einfache Schätzung: 1 Token pro 4 Zeichen (für englischen Text)
		// Für andere Sprachen kann dies variieren
		const estimatedTokens = Math.ceil(text.length / 4);

		console.log(`estimateTokens: Geschätzte Tokens = ${estimatedTokens}`);

		return estimatedTokens;
	} catch (error) {
		console.error('Fehler bei der Token-Schätzung:', error);
		return 1; // Fallback-Wert im Fehlerfall
	}
};

/**
 * Holt die Preisdaten für ein bestimmtes Modell aus der Datenbank
 */
export const getModelPrice = async (modelName: string): Promise<ModelPrice | null> => {
	const { data, error } = await supabase
		.from('model_prices')
		.select('*')
		.eq('model_name', modelName)
		.single();

	if (error) {
		console.error('Fehler beim Abrufen der Modellpreise:', error);
		return null;
	}

	return data;
};

/**
 * Berechnet die Kosten für eine KI-Anfrage basierend auf dem Modell und der Token-Anzahl
 */
export const calculateCost = async (
	model: string,
	promptTokens: number,
	completionTokens: number
): Promise<TokenCostEstimate> => {
	try {
		// Debugging-Ausgaben
		console.log('Berechne Kosten für:', { model, promptTokens, completionTokens });

		// Stelle sicher, dass die Token-Zahlen gültige Zahlen sind
		if (isNaN(promptTokens) || promptTokens < 0) {
			console.warn('Ungültige promptTokens:', promptTokens);
			promptTokens = 0;
		}

		if (isNaN(completionTokens) || completionTokens < 0) {
			console.warn('Ungültige completionTokens:', completionTokens);
			completionTokens = 0;
		}

		// Standardwerte für den Fall, dass keine Preisdaten gefunden werden
		let inputPricePer1kTokens = 0.01; // $0.01 pro 1000 Tokens
		let outputPricePer1kTokens = 0.03; // $0.03 pro 1000 Tokens
		let tokensPerDollar = 50000; // 50.000 App-Tokens pro Dollar

		// Versuche, die tatsächlichen Preisdaten aus der Datenbank zu holen
		const modelPrice = await getModelPrice(model);

		if (modelPrice) {
			console.log('Modellpreis gefunden:', modelPrice);
			inputPricePer1kTokens = modelPrice.input_price_per_1k_tokens;
			outputPricePer1kTokens = modelPrice.output_price_per_1k_tokens;
			tokensPerDollar = modelPrice.tokens_per_dollar;
		} else {
			console.warn('Keine Preisdaten für Modell gefunden:', model);
		}

		// Berechne die Kosten in USD
		const inputCost = (promptTokens / 1000) * inputPricePer1kTokens;
		const outputCost = (completionTokens / 1000) * outputPricePer1kTokens;
		const totalCostUsd = inputCost + outputCost;

		// Stelle sicher, dass tokensPerDollar ein gültiger Wert ist
		if (!tokensPerDollar || isNaN(tokensPerDollar) || tokensPerDollar <= 0) {
			tokensPerDollar = 50000; // Standardwert, falls nicht gültig
		}

		// Berechne die Anzahl der App-Tokens
		const appTokens = Math.ceil(totalCostUsd * tokensPerDollar);

		// Debugging-Ausgabe für das Ergebnis
		console.log('Berechnete Kosten:', {
			inputCost,
			outputCost,
			totalCostUsd,
			tokensPerDollar,
			appTokens,
		});

		return {
			inputTokens: promptTokens,
			outputTokens: completionTokens,
			totalTokens: promptTokens + completionTokens,
			costUsd: totalCostUsd,
			appTokens: Math.max(1, appTokens), // Mindestens 1 Token
		};
	} catch (error) {
		console.error('Fehler bei der Kostenberechnung:', error);

		// Fallback-Werte im Fehlerfall
		return {
			inputTokens: promptTokens || 0,
			outputTokens: completionTokens || 0,
			totalTokens: (promptTokens || 0) + (completionTokens || 0),
			costUsd: 0.01,
			appTokens: 1,
		};
	}
};

/**
 * Schätzt die Kosten für einen Prompt und eine erwartete Antwortlänge
 */
export const estimateCostForPrompt = async (
	prompt: string,
	model: string,
	estimatedCompletionLength: number = 500
): Promise<TokenCostEstimate> => {
	console.log('estimateCostForPrompt aufgerufen mit:', {
		promptLength: prompt.length,
		model,
		estimatedCompletionLength,
	});

	const promptTokens = estimateTokens(prompt);
	console.log('Berechnete promptTokens:', promptTokens);

	const completionTokens = estimatedCompletionLength;

	console.log('Rufe calculateCost auf mit:', {
		model,
		promptTokens,
		completionTokens,
	});

	const result = await calculateCost(model, promptTokens, completionTokens);
	console.log('Ergebnis von calculateCost:', result);

	return result;
};

/**
 * Konvertiert einen USD-Betrag in App-Tokens basierend auf dem Modell
 */
export const convertUSDToAppTokens = async (usdAmount: number, model: string): Promise<number> => {
	// Standardwert für den Fall, dass keine Preisdaten gefunden werden
	let tokensPerDollar = 50000; // 50.000 App-Tokens pro Dollar

	// Versuche, die tatsächlichen Preisdaten aus der Datenbank zu holen
	const modelPrice = await getModelPrice(model);

	if (modelPrice) {
		tokensPerDollar = modelPrice.tokens_per_dollar;
	}

	return Math.ceil(usdAmount * tokensPerDollar);
};

/**
 * Konvertiert App-Tokens in einen USD-Betrag basierend auf dem Modell
 */
export const convertAppTokensToUSD = async (appTokens: number, model: string): Promise<number> => {
	try {
		const modelPrice = await getModelPrice(model);

		if (!modelPrice) {
			return appTokens / 50000; // Standardwert: 50.000 App-Tokens pro Dollar
		}

		return appTokens / modelPrice.tokens_per_dollar;
	} catch (error) {
		console.error('Fehler bei der Konvertierung von App-Tokens zu USD:', error);
		return appTokens / 50000; // Fallback-Wert
	}
};

/**
 * Berechnet die Token-Anzahl für ein Dokument und aktualisiert die Metadaten
 * Diese Funktion sollte beim Erstellen oder Aktualisieren eines Dokuments aufgerufen werden
 */
export const updateDocumentTokenCount = (document: {
	content: string | null;
	metadata: any;
}): { metadata: any; tokenCount: number } => {
	// Stelle sicher, dass die Metadaten initialisiert sind
	const metadata = document.metadata || {};

	// Berechne die Token-Anzahl
	const tokenCount = estimateTokens(document.content || '');

	// Aktualisiere die Metadaten
	metadata.token_count = tokenCount;

	return { metadata, tokenCount };
};
