/**
 * Chat Service - AI API calls via Backend
 * This service wraps the backend API for AI completions
 */
import { availableModels } from '../config/azure';
import { chatApi, modelApi, usageApi, type ChatMessage, type TokenUsage } from './api';

// Re-export types for backward compatibility
export type { ChatMessage };

// Re-export TokenUsage
export type { TokenUsage };

// Chat response type (kept for compatibility)
export type ChatResponse = {
	id: string;
	choices: {
		content_filter_results?: any;
		finish_reason: string;
		index: number;
		logprobs: any;
		message?: {
			content: string;
			refusal?: any;
			role: string;
		};
	}[];
	created: number;
	model: string;
	object: string;
	prompt_filter_results?: any[];
	system_fingerprint?: string;
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
		completion_tokens_details?: any;
		prompt_tokens_details?: any;
	};
};

// Return type for chat request
export type ChatRequestResult = {
	content: string;
	usage: TokenUsage;
};

// Logging configuration
console.log('Chat Service Konfiguration:', {
	backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001',
	availableModels: availableModels.length,
});

/**
 * Calculates estimated cost for an LLM request
 */
export async function calculateTokenCost(
	promptTokens: number,
	completionTokens: number,
	modelId: string
): Promise<number> {
	try {
		// Get cost settings from model
		const modelData = await modelApi.getModel(modelId);

		if (!modelData || !modelData.costSettings) {
			console.warn('Fehler beim Laden der Kosteninformationen, verwende Standardwerte');
			const promptCost = 0.0001;
			const completionCost = 0.0002;

			const cost = (promptTokens * promptCost + completionTokens * completionCost) / 1000;
			return Number(cost.toFixed(6));
		}

		const promptCost = modelData.costSettings.prompt_per_1k_tokens || 0.0001;
		const completionCost = modelData.costSettings.completion_per_1k_tokens || 0.0002;

		const cost = (promptTokens * promptCost + completionTokens * completionCost) / 1000;
		return Number(cost.toFixed(6));
	} catch (error) {
		console.error('Fehler bei der Kostenberechnung:', error);
		return Number(((promptTokens * 0.0001 + completionTokens * 0.0002) / 1000).toFixed(6));
	}
}

/**
 * Logs token usage to the database
 */
export async function logTokenUsage(
	usage: TokenUsage,
	conversationId: string,
	messageId: string,
	userId: string,
	modelId: string
): Promise<void> {
	try {
		const estimatedCost = await calculateTokenCost(
			usage.prompt_tokens,
			usage.completion_tokens,
			modelId
		);

		const success = await usageApi.logTokenUsage({
			conversationId,
			messageId,
			modelId,
			promptTokens: usage.prompt_tokens,
			completionTokens: usage.completion_tokens,
			totalTokens: usage.total_tokens,
			estimatedCost,
		});

		if (success) {
			console.log('Token-Nutzung erfolgreich gespeichert:', {
				conversationId,
				messageId,
				totalTokens: usage.total_tokens,
				estimatedCost,
			});
		} else {
			console.error('Fehler beim Speichern der Token-Nutzung');
		}
	} catch (error) {
		console.error('Fehler beim Loggen der Token-Nutzung:', error);
	}
}

/**
 * Sends a chat request via the backend
 */
export async function sendChatRequest(
	messages: ChatMessage[],
	temperature: number = 0.7,
	maxTokens: number = 800
): Promise<string | ChatRequestResult> {
	console.log('sendChatRequest gestartet mit:', {
		messagesCount: messages.length,
		maxTokens,
	});

	try {
		// Find model deployment from system message
		let modelId = '550e8400-e29b-41d4-a716-446655440000'; // Default to GPT-O3-Mini

		const systemMessage = messages.find(
			(msg) => msg.role === 'system' && msg.content.startsWith('MODEL:')
		);
		if (systemMessage) {
			const deployment = systemMessage.content.split(':')[1].trim();
			console.log('Modell in system Nachricht erkannt:', deployment);

			// Map deployment to model ID
			const deploymentToModelId: Record<string, string> = {
				'gpt-o3-mini-se': '550e8400-e29b-41d4-a716-446655440000',
				'gpt-4o-mini-se': '550e8400-e29b-41d4-a716-446655440004',
				'gpt-4o-se': '550e8400-e29b-41d4-a716-446655440005',
			};

			modelId = deploymentToModelId[deployment] || modelId;
		} else {
			console.warn('Keine System-Nachricht mit MODEL-Präfix gefunden!');
		}

		console.log('Verwende Model ID:', modelId);

		// Filter out MODEL: system messages before sending to API
		const filteredMessages = messages.filter(
			(msg) => !(msg.role === 'system' && msg.content.startsWith('MODEL:'))
		);

		// Send request to backend
		const result = await chatApi.createCompletion({
			messages: filteredMessages,
			modelId,
			temperature,
			maxTokens,
		});

		if (!result) {
			return 'Es tut mir leid, aber ich konnte keine Antwort generieren. Bitte stelle sicher, dass das Backend läuft.';
		}

		return {
			content: result.content,
			usage: result.usage,
		};
	} catch (error) {
		console.error('Fehler bei der Chat-Anfrage:', error);

		if (error instanceof Error) {
			console.error('Fehlerdetails:', {
				name: error.name,
				message: error.message,
				stack: error.stack,
			});
		}

		return `Es tut mir leid, aber ich konnte keine Antwort generieren. Bitte stelle sicher, dass das Backend läuft. Fehlerdetails: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`;
	}
}
