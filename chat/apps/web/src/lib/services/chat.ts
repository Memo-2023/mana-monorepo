/**
 * Chat Service - AI Completions via Backend
 */

import { api } from './api';
import type { ChatMessage, ChatCompletionResponse, AIModel } from '@chat/types';

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
  async getModels(): Promise<AIModel[]> {
    const { data, error } = await api.get<AIModel[]>('/api/chat/models');
    if (error) {
      console.error('Failed to fetch models:', error);
      return [];
    }
    return data || [];
  },

  /**
   * Send chat completion request
   */
  async createCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse | null> {
    const { data, error } = await api.post<ChatCompletionResponse>('/api/chat/completions', {
      messages: request.messages,
      modelId: request.modelId,
      temperature: request.temperature ?? 0.7,
      maxTokens: request.maxTokens ?? 1000,
    });

    if (error) {
      console.error('Chat completion failed:', error);
      return null;
    }

    return data || null;
  },
};
