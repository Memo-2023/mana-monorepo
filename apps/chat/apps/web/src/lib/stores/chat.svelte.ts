/**
 * Chat Store - Manages current chat state using Svelte 5 runes
 */

import { chatService } from '$lib/services/chat';
import type { ChatCompletionRequest } from '$lib/services/chat';
import type { Message, AIModel, ChatMessage } from '@chat/types';
import { ChatEvents } from '@manacore/shared-utils/analytics';

// State
let messages = $state<Message[]>([]);
let models = $state<AIModel[]>([]);
let selectedModelId = $state<string>('');
let isLoading = $state(false);
let isSending = $state(false);
let error = $state<string | null>(null);

// Temporary message counter for IDs
let messageCounter = 0;

export const chatStore = {
	// Getters
	get messages() {
		return messages;
	},
	get models() {
		return models;
	},
	get selectedModelId() {
		return selectedModelId;
	},
	get selectedModel() {
		return models.find((m) => m.id === selectedModelId) || null;
	},
	get isLoading() {
		return isLoading;
	},
	get isSending() {
		return isSending;
	},
	get error() {
		return error;
	},

	// Actions
	async loadModels() {
		isLoading = true;
		error = null;
		try {
			models = await chatService.getModels();
			if (models.length > 0 && !selectedModelId) {
				// Find default model, or fall back to first model
				const defaultModel = models.find((m) => m.isDefault);
				selectedModelId = defaultModel?.id || models[0].id;
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load models';
		} finally {
			isLoading = false;
		}
	},

	setSelectedModel(modelId: string) {
		selectedModelId = modelId;
	},

	async sendMessage(text: string) {
		if (!text.trim() || !selectedModelId) return;

		isSending = true;
		error = null;

		// Add user message
		const userMessage: Message = {
			id: `temp-${++messageCounter}`,
			conversationId: '',
			sender: 'user',
			messageText: text,
			createdAt: new Date().toISOString(),
		};
		messages = [...messages, userMessage];

		try {
			// Build chat messages for API
			const chatMessages: ChatMessage[] = messages.map((m) => ({
				role: m.sender === 'user' ? 'user' : 'assistant',
				content: m.messageText,
			}));

			const request: ChatCompletionRequest = {
				messages: chatMessages,
				modelId: selectedModelId,
			};

			const response = await chatService.createCompletion(request);

			if (response) {
				// Add assistant message
				const assistantMessage: Message = {
					id: `temp-${++messageCounter}`,
					conversationId: '',
					sender: 'assistant',
					messageText: response.content,
					createdAt: new Date().toISOString(),
				};
				messages = [...messages, assistantMessage];
				ChatEvents.messageSent(selectedModelId);
			} else {
				error = 'Failed to get response';
			}
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to send message';
		} finally {
			isSending = false;
		}
	},

	clearMessages() {
		messages = [];
		messageCounter = 0;
		error = null;
	},

	reset() {
		messages = [];
		messageCounter = 0;
		error = null;
		isSending = false;
	},
};
