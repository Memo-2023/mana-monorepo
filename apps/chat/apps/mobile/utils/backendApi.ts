/**
 * Backend API Client
 * Handles all communication with the NestJS backend
 * API keys are stored securely on the backend - not in the mobile app
 */

import { ChatMessage } from '../services/openai';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Token usage type
export type TokenUsage = {
	prompt_tokens: number;
	completion_tokens: number;
	total_tokens: number;
};

// Chat completion response
export type ChatCompletionResponse = {
	content: string;
	usage: TokenUsage;
};

// AI Model type from backend
export type AIModel = {
	id: string;
	name: string;
	description: string;
	parameters: {
		temperature: number;
		max_tokens: number;
		provider: string;
		deployment: string;
		endpoint: string;
		api_version: string;
	};
};

/**
 * Fetches available AI models from the backend
 */
export async function getAvailableModels(): Promise<AIModel[]> {
	try {
		const response = await fetch(`${BACKEND_URL}/api/chat/models`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			throw new Error(`Failed to fetch models: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		console.error('Error fetching models from backend:', error);
		throw error;
	}
}

/**
 * Sends a chat completion request to the backend
 * The backend securely handles the Azure OpenAI API call
 */
export async function sendChatCompletion(
	messages: ChatMessage[],
	modelId: string,
	temperature?: number,
	maxTokens?: number
): Promise<ChatCompletionResponse> {
	console.log('Sending chat request to backend:', {
		messagesCount: messages.length,
		modelId,
		temperature,
		maxTokens,
		backendUrl: BACKEND_URL,
	});

	try {
		const response = await fetch(`${BACKEND_URL}/api/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				messages: messages.map((msg) => ({
					role: msg.role,
					content: msg.content,
				})),
				modelId,
				temperature,
				maxTokens,
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('Backend API error:', response.status, errorText);
			throw new Error(`Backend API error: ${response.status} - ${errorText}`);
		}

		const data = await response.json();
		console.log('Backend response received:', {
			contentLength: data.content?.length,
			usage: data.usage,
		});

		return {
			content: data.content,
			usage: data.usage,
		};
	} catch (error) {
		console.error('Error sending chat request to backend:', error);
		throw error;
	}
}

/**
 * Health check for the backend
 */
export async function checkBackendHealth(): Promise<boolean> {
	try {
		const response = await fetch(`${BACKEND_URL}/api/health`, {
			method: 'GET',
		});
		return response.ok;
	} catch (error) {
		console.error('Backend health check failed:', error);
		return false;
	}
}
