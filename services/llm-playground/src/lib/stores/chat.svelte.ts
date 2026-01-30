import type { ChatMessage, Message } from '$lib/types';
import { streamCompletion } from '$lib/api/llm';
import { settingsStore } from './settings.svelte';

function generateId(): string {
	return crypto.randomUUID();
}

function createChatStore() {
	let messages = $state<ChatMessage[]>([]);
	let isStreaming = $state(false);
	let abortController = $state<AbortController | null>(null);

	return {
		get messages() {
			return messages;
		},
		get isStreaming() {
			return isStreaming;
		},

		async sendMessage(content: string) {
			if (isStreaming || !content.trim()) return;

			// Add user message
			const userMessage: ChatMessage = {
				id: generateId(),
				role: 'user',
				content: content.trim(),
				timestamp: new Date(),
			};
			messages.push(userMessage);

			// Create assistant message placeholder
			const assistantMessage: ChatMessage = {
				id: generateId(),
				role: 'assistant',
				content: '',
				timestamp: new Date(),
				model: settingsStore.model,
				isStreaming: true,
			};
			messages.push(assistantMessage);

			// Build messages for API
			const apiMessages: Message[] = [];

			if (settingsStore.systemPrompt.trim()) {
				apiMessages.push({
					role: 'system',
					content: settingsStore.systemPrompt,
				});
			}

			for (const msg of messages) {
				if (msg.role === 'user' || (msg.role === 'assistant' && !msg.isStreaming)) {
					apiMessages.push({
						role: msg.role,
						content: msg.content,
					});
				}
			}

			// Start streaming
			isStreaming = true;
			abortController = new AbortController();

			try {
				const stream = streamCompletion({
					model: settingsStore.model,
					messages: apiMessages,
					temperature: settingsStore.temperature,
					max_tokens: settingsStore.maxTokens,
					top_p: settingsStore.topP,
					stream: true,
				});

				for await (const chunk of stream) {
					// Find and update the assistant message
					const idx = messages.findIndex((m) => m.id === assistantMessage.id);
					if (idx !== -1) {
						messages[idx].content += chunk;
					}
				}

				// Mark streaming complete
				const idx = messages.findIndex((m) => m.id === assistantMessage.id);
				if (idx !== -1) {
					messages[idx].isStreaming = false;
					messages[idx].timestamp = new Date();
				}
			} catch (error) {
				// Update message with error
				const idx = messages.findIndex((m) => m.id === assistantMessage.id);
				if (idx !== -1) {
					messages[idx].content = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
					messages[idx].isStreaming = false;
				}
			} finally {
				isStreaming = false;
				abortController = null;
			}
		},

		stopStreaming() {
			if (abortController) {
				abortController.abort();
			}
		},

		clearMessages() {
			messages = [];
			isStreaming = false;
		},

		exportMessages(): string {
			return JSON.stringify(
				{
					exported: new Date().toISOString(),
					settings: {
						model: settingsStore.model,
						temperature: settingsStore.temperature,
						maxTokens: settingsStore.maxTokens,
						topP: settingsStore.topP,
						systemPrompt: settingsStore.systemPrompt,
					},
					messages: messages.map((m) => ({
						role: m.role,
						content: m.content,
						timestamp: m.timestamp,
						model: m.model,
					})),
				},
				null,
				2
			);
		},
	};
}

export const chatStore = createChatStore();
