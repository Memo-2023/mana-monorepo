/**
 * Chat Service - AI Completions via Backend API
 */

import {
	chatApi,
	modelApi,
	type ChatMessage,
	type ChatCompletionResponse,
	type Model,
} from './api';

export type { ChatMessage, ChatCompletionResponse };

export interface ChatCompletionRequest {
	messages: ChatMessage[];
	modelId: string;
	temperature?: number;
	maxTokens?: number;
}

export const chatService = {
	/**
	 * Get available AI models
	 */
	async getModels(): Promise<Model[]> {
		return modelApi.getModels();
	},

	/**
	 * Send chat completion request
	 */
	async createCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse | null> {
		return chatApi.createCompletion({
			messages: request.messages,
			modelId: request.modelId,
			temperature: request.temperature ?? 0.7,
			maxTokens: request.maxTokens ?? 1000,
		});
	},
};
