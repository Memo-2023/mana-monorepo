import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../utils/supabase';
import { estimateTokens, estimateCostForPrompt, calculateCost } from './tokenCountingService';
import { logTokenUsage, hasEnoughTokens, getCurrentTokenBalance } from './tokenTransactionService';

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
	documentId?: string; // ID des Dokuments, für das der Text generiert wird
	referencedDocuments?: { title: string; content: string }[]; // Referenzierte Dokumente für die Token-Berechnung
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

// Verfügbare Modelle
export const availableModels: AIModelOption[] = [
	{ label: 'GPT-4.1', value: 'gpt-4.1', provider: 'azure' },
	{ label: 'Gemini Pro', value: 'gemini-pro', provider: 'google' },
	{ label: 'Gemini Flash', value: 'gemini-flash', provider: 'google' },
];

// Konfiguration der API-Clients
// Azure OpenAI Konfiguration
const AZURE_OPENAI_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';
const AZURE_OPENAI_ENDPOINT = 'https://memoroseopenai.openai.azure.com/';
const AZURE_OPENAI_DEPLOYMENT = 'gpt-4.1';
const AZURE_OPENAI_API_VERSION = '2025-01-01-preview';

// Google AI Konfiguration
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY || '';

// Initialisiere Azure OpenAI Client
const azureClient = new OpenAI({
	apiKey: AZURE_OPENAI_KEY,
	baseURL: `${AZURE_OPENAI_ENDPOINT}openai/deployments/${AZURE_OPENAI_DEPLOYMENT}`,
	defaultQuery: { 'api-version': AZURE_OPENAI_API_VERSION },
	defaultHeaders: { 'api-key': AZURE_OPENAI_KEY },
	dangerouslyAllowBrowser: true, // Erlaubt die Ausführung im Browser (für Entwicklungszwecke)
});

// Initialisiere Google AI Client
const googleAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

/**
 * Prüft, ob der Benutzer genügend Tokens für eine Anfrage hat
 *
 * @param prompt Der Hauptprompt (ohne referenzierte Dokumente)
 * @param model Das zu verwendende KI-Modell
 * @param estimatedCompletionLength Geschätzte Länge der Antwort in Tokens
 * @param referencedDocuments Optional: Array von referenzierten Dokumenten, die zum Prompt hinzugefügt werden
 */
export const checkTokenBalance = async (
	prompt: string,
	model: string,
	estimatedCompletionLength: number = 500,
	referencedDocuments?: { title: string; content: string }[]
): Promise<{ hasEnough: boolean; estimate: any; balance: number }> => {
	try {
		console.log('checkTokenBalance aufgerufen mit:', {
			promptLength: prompt.length,
			model,
			estimatedCompletionLength,
			referencedDocumentsCount: referencedDocuments?.length || 0,
		});

		// Hole den aktuellen Benutzer
		const { data: sessionData } = await supabase.auth.getSession();
		const userId = sessionData?.session?.user?.id;

		if (!userId) {
			throw new Error('Nicht angemeldet');
		}

		// Berechne die Token-Anzahl des Basis-Prompts
		const basePromptTokens = estimateTokens(prompt);
		console.log('Basis-Prompt Tokens:', basePromptTokens);

		// Berechne die Token-Anzahl der referenzierten Dokumente
		let documentTokens = 0;
		let fullPrompt = prompt;

		// Füge referenzierte Dokumente hinzu, falls vorhanden
		if (referencedDocuments && referencedDocuments.length > 0) {
			console.log(`Verarbeite ${referencedDocuments.length} referenzierte Dokumente:`);

			// Formatierungs-Overhead für die Dokumente
			const formattingOverhead = 20 + referencedDocuments.length * 10;
			documentTokens += formattingOverhead;
			console.log('Formatierungs-Overhead:', formattingOverhead);

			fullPrompt += '\n\nReferenzierte Dokumente:\n\n';

			referencedDocuments.forEach((doc, index) => {
				console.log(
					`Dokument ${index + 1}: Titel="${doc.title}", Inhaltslänge=${doc.content?.length || 0}`
				);

				const docContent = `Dokument ${index + 1} (${doc.title}):\n${doc.content || ''}\n\n`;
				fullPrompt += docContent;

				// Berechne die Token-Anzahl für dieses Dokument
				const docTokens = estimateTokens(doc.content || '');
				documentTokens += docTokens;
				console.log(`Dokument ${index + 1} Tokens:`, docTokens);
			});

			console.log('Gesamte Dokument-Tokens:', documentTokens);
		} else {
			console.log('Keine referenzierten Dokumente vorhanden');
		}

		// WICHTIG: Hier liegt möglicherweise das Problem!
		// Statt den vollständigen Prompt zu übergeben, berechnen wir die Tokens separat
		// und übergeben die Summe an estimateCostForPrompt
		const totalInputTokens = basePromptTokens + documentTokens;
		console.log('Gesamte Input-Tokens (Basis + Dokumente):', totalInputTokens);

		// Erstelle einen Dummy-Prompt mit der richtigen Länge für die Kostenberechnung
		// Dies stellt sicher, dass die richtige Anzahl von Tokens verwendet wird
		const dummyPrompt = 'X'.repeat(totalInputTokens * 4); // 4 Zeichen pro Token

		// Schätze die Kosten basierend auf der Gesamtzahl der Tokens
		console.log('Rufe estimateCostForPrompt mit Dummy-Prompt der Länge', dummyPrompt.length, 'auf');
		const estimate = await estimateCostForPrompt(dummyPrompt, model, estimatedCompletionLength);

		// Füge die Aufschlüsselung der Token-Anzahl zur Schätzung hinzu
		estimate.basePromptTokens = basePromptTokens;
		estimate.documentTokens = documentTokens;

		// Überprüfe, ob die Gesamtzahl der Input-Tokens korrekt ist
		console.log('Input-Tokens in der Schätzung:', estimate.inputTokens);
		console.log('Erwartete Input-Tokens (Basis + Dokumente):', totalInputTokens);

		if (estimate.inputTokens !== totalInputTokens) {
			console.warn(
				'WARNUNG: Die Anzahl der Input-Tokens in der Schätzung stimmt nicht mit der erwarteten Anzahl überein!'
			);
			// Korrigiere die Werte in der Schätzung
			estimate.inputTokens = totalInputTokens;
			estimate.totalTokens = totalInputTokens + estimate.outputTokens;
			console.log('Korrigierte Schätzung:', estimate);
		}

		// Hole das aktuelle Token-Guthaben
		const balance = await getCurrentTokenBalance(userId);

		// Prüfe, ob genügend Tokens vorhanden sind
		const hasEnough = balance >= estimate.appTokens;

		return { hasEnough, estimate, balance };
	} catch (error) {
		console.error('Fehler beim Prüfen des Token-Guthabens:', error);
		return { hasEnough: false, estimate: null, balance: 0 };
	}
};

/**
 * Generiert Text mit dem angegebenen KI-Modell
 */
export const generateText = async (
	prompt: string,
	provider: AIProvider = 'azure',
	options: AIGenerationOptions = {}
): Promise<AIGenerationResult> => {
	try {
		// Hole den aktuellen Benutzer
		const { data: sessionData } = await supabase.auth.getSession();
		const userId = sessionData?.session?.user?.id;

		if (!userId) {
			throw new Error('Nicht angemeldet');
		}

		// Bestimme das Modell
		const model = options.model || (provider === 'azure' ? 'gpt-4.1' : 'gemini-pro');

		// Prüfe, ob eine manuelle Token-Schätzung übergeben wurde
		let manualInputTokens = 0;
		if (options.prompt) {
			// Versuche, die manuelle Token-Schätzung zu parsen
			try {
				manualInputTokens = parseInt(options.prompt, 10);
			} catch (e) {
				console.warn('Konnte manuelle Token-Schätzung nicht parsen:', options.prompt);
			}
		}

		// Schätze die Kosten
		let hasEnough = false;
		let estimate: any = null;

		if (manualInputTokens > 0) {
			// Verwende die manuelle Token-Schätzung
			const result = await calculateCost(model, manualInputTokens, options.maxTokens || 2000); // Standard auf 2000 Tokens statt 500
			estimate = result;

			// Prüfe, ob genügend Tokens vorhanden sind
			const balance = await getCurrentTokenBalance(userId);
			hasEnough = balance >= result.appTokens;
		} else {
			// Verwende die automatische Token-Schätzung
			const result = await checkTokenBalance(
				prompt,
				model,
				options.maxTokens || 2000 // Standard auf 2000 Tokens statt 500
			);

			hasEnough = result.hasEnough;
			estimate = result.estimate;
		}

		if (!hasEnough) {
			throw new Error('Nicht genügend Tokens für diese Anfrage. Bitte kaufen Sie weitere Tokens.');
		}

		// Generiere den Text
		let completionText = '';
		switch (provider) {
			case 'azure':
				completionText = await generateWithAzureOpenAI(prompt, options);
				break;
			case 'google':
				completionText = await generateWithGoogle(prompt, options);
				break;
			default:
				throw new Error(`Unbekannter Provider: ${provider}`);
		}

		// Berechne die tatsächliche Anzahl der Output-Tokens
		const completionTokens = estimateTokens(completionText);

		// Berechne die tatsächlichen Kosten mit den realen Output-Tokens
		const realCost = await calculateCost(model, estimate.inputTokens, completionTokens);

		// Deutliche Protokollierung der tatsächlichen Kosten
		console.log('=== TATSÄCHLICHE TOKEN-KOSTEN NACH GENERIERUNG ===');
		console.log('Geschätzte Kosten vor Generierung:', {
			inputTokens: estimate.inputTokens,
			outputTokens: options.maxTokens || 500,
			appTokens: estimate.appTokens,
			costUsd: estimate.costUsd,
		});
		console.log('Tatsächliche Kosten nach Generierung:', {
			inputTokens: estimate.inputTokens,
			outputTokens: completionTokens,
			appTokens: realCost.appTokens,
			costUsd: realCost.costUsd,
			differenz: estimate.appTokens - realCost.appTokens,
		});

		// Protokolliere die Token-Nutzung mit den tatsächlichen Werten
		await logTokenUsage(userId, model, prompt, completionText, options.documentId);

		// Hole das aktualisierte Token-Guthaben
		const remainingTokens = await getCurrentTokenBalance(userId);

		return {
			text: completionText,
			tokenInfo: {
				promptTokens: estimate.inputTokens,
				completionTokens: completionTokens,
				totalTokens: estimate.inputTokens + completionTokens,
				tokensUsed: realCost.appTokens, // Verwende die tatsächlichen Kosten
				remainingTokens: remainingTokens,
			},
		};
	} catch (error: any) {
		console.error('Fehler bei der Textgenerierung:', error);
		throw new Error(`Textgenerierung fehlgeschlagen: ${error.message}`);
	}
};

/**
 * Generiert Text mit Azure OpenAI-Modellen
 */
const generateWithAzureOpenAI = async (
	prompt: string,
	options: AIGenerationOptions = {}
): Promise<string> => {
	if (!AZURE_OPENAI_KEY) {
		throw new Error('Azure OpenAI API-Schlüssel nicht konfiguriert');
	}

	try {
		const response = await azureClient.chat.completions.create({
			model: AZURE_OPENAI_DEPLOYMENT,
			messages: [
				{ role: 'system', content: 'You are a helpful assistant.' },
				{ role: 'user', content: prompt },
			],
			temperature: options.temperature || 0.7,
			max_tokens: options.maxTokens || 500,
		});

		return response.choices[0].message.content || '';
	} catch (error) {
		console.error('Fehler bei Azure OpenAI-Anfrage:', error);
		throw error;
	}
};

/**
 * Generiert Text mit Google Gemini-Modellen
 */
const generateWithGoogle = async (
	prompt: string,
	options: AIGenerationOptions = {}
): Promise<string> => {
	if (!GOOGLE_API_KEY) {
		throw new Error('Google API-Schlüssel nicht konfiguriert');
	}

	try {
		const model = googleAI.getGenerativeModel({
			model: options.model || 'gemini-pro',
		});

		const result = await model.generateContent(prompt);
		const response = await result.response;
		return response.text();
	} catch (error) {
		console.error('Fehler bei Google AI-Anfrage:', error);
		throw error;
	}
};

/**
 * Hilfsfunktion zum Abrufen von Modelloptionen für einen bestimmten Provider
 */
export const getModelsByProvider = (provider: AIProvider): AIModelOption[] => {
	return availableModels.filter((model) => model.provider === provider);
};

/**
 * Hilfsfunktion zum Abrufen des Providers für ein bestimmtes Modell
 */
export const getProviderForModel = (modelValue: string): AIProvider => {
	const model = availableModels.find((m) => m.value === modelValue);
	return model?.provider || 'azure';
};
