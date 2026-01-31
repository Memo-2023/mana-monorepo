import type { AnyMessage, ChatMessage, ComparisonMessage, Message } from '$lib/types';
import { streamCompletion } from '$lib/api/llm';
import { settingsStore } from './settings.svelte';
import { comparisonStore } from './comparison.svelte';

function generateId(): string {
	return crypto.randomUUID();
}

function createChatStore() {
	let messages = $state<AnyMessage[]>([]);
	let isStreaming = $state(false);
	let abortController = $state<AbortController | null>(null);

	// Helper to extract conversation history for API calls
	function getConversationHistory(): Message[] {
		const history: Message[] = [];
		for (const msg of messages) {
			if (msg.role === 'user') {
				history.push({ role: 'user', content: (msg as ChatMessage).content });
			} else if (msg.role === 'assistant' && !(msg as ChatMessage).isStreaming) {
				history.push({ role: 'assistant', content: (msg as ChatMessage).content });
			}
			// Skip comparison messages in history for now
		}
		return history;
	}

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
				if (msg.role === 'comparison') continue; // Skip comparison messages
				const chatMsg = msg as ChatMessage;
				if (chatMsg.role === 'user' || (chatMsg.role === 'assistant' && !chatMsg.isStreaming)) {
					apiMessages.push({
						role: chatMsg.role,
						content: chatMsg.content,
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
						(messages[idx] as ChatMessage).content += chunk;
					}
				}

				// Mark streaming complete
				const idx = messages.findIndex((m) => m.id === assistantMessage.id);
				if (idx !== -1) {
					(messages[idx] as ChatMessage).isStreaming = false;
					(messages[idx] as ChatMessage).timestamp = new Date();
				}
			} catch (error) {
				// Update message with error
				const idx = messages.findIndex((m) => m.id === assistantMessage.id);
				if (idx !== -1) {
					(messages[idx] as ChatMessage).content =
						`Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
					(messages[idx] as ChatMessage).isStreaming = false;
				}
			} finally {
				isStreaming = false;
				abortController = null;
			}
		},

		async sendComparisonMessage(content: string) {
			if (isStreaming || !content.trim()) return;
			if (comparisonStore.selectedModels.length < 2) return;

			const comparisonMsg: ComparisonMessage = {
				id: generateId(),
				role: 'comparison',
				userContent: content.trim(),
				responses: [],
				timestamp: new Date(),
			};

			messages = [...messages, comparisonMsg];
			isStreaming = true;

			try {
				const history = getConversationHistory();
				await comparisonStore.compareModels(
					content.trim(),
					comparisonStore.selectedModels,
					history,
					(responses) => {
						const idx = messages.findIndex((m) => m.id === comparisonMsg.id);
						if (idx !== -1) {
							(messages[idx] as ComparisonMessage).responses = responses;
							messages = [...messages];
						}
					}
				);
			} finally {
				isStreaming = false;
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
					messages: messages.map((m) => {
						if (m.role === 'comparison') {
							const compMsg = m as ComparisonMessage;
							return {
								role: 'comparison',
								userContent: compMsg.userContent,
								responses: compMsg.responses,
								timestamp: compMsg.timestamp,
							};
						}
						const chatMsg = m as ChatMessage;
						return {
							role: chatMsg.role,
							content: chatMsg.content,
							timestamp: chatMsg.timestamp,
							model: chatMsg.model,
						};
					}),
				},
				null,
				2
			);
		},
	};
}

export const chatStore = createChatStore();
