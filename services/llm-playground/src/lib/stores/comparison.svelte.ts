import { streamCompletion } from '$lib/api/llm';
import type { ComparisonResponse, ChatCompletionRequest, Message } from '$lib/types';
import { settingsStore } from './settings.svelte';

function createComparisonStore() {
	let comparisonMode = $state(false);
	let selectedModels = $state<string[]>([]);
	const maxModels = 4;

	return {
		get comparisonMode() {
			return comparisonMode;
		},
		get selectedModels() {
			return selectedModels;
		},
		get maxModels() {
			return maxModels;
		},

		toggleComparisonMode() {
			comparisonMode = !comparisonMode;
			if (!comparisonMode) {
				selectedModels = [];
			}
		},

		setComparisonMode(value: boolean) {
			comparisonMode = value;
			if (!value) {
				selectedModels = [];
			}
		},

		toggleModel(modelId: string) {
			if (selectedModels.includes(modelId)) {
				selectedModels = selectedModels.filter((m) => m !== modelId);
			} else if (selectedModels.length < maxModels) {
				selectedModels = [...selectedModels, modelId];
			}
		},

		isModelSelected(modelId: string): boolean {
			return selectedModels.includes(modelId);
		},

		clearSelection() {
			selectedModels = [];
		},

		canAddModel(): boolean {
			return selectedModels.length < maxModels;
		},

		async compareModels(
			content: string,
			models: string[],
			conversationHistory: Message[],
			onUpdate: (responses: ComparisonResponse[]) => void
		): Promise<ComparisonResponse[]> {
			const responses: ComparisonResponse[] = models.map((modelId) => ({
				modelId,
				content: '',
				isStreaming: true,
				startTime: Date.now(),
			}));

			onUpdate([...responses]);

			// Build base messages including history
			const baseMessages: Message[] = [];

			if (settingsStore.systemPrompt.trim()) {
				baseMessages.push({
					role: 'system',
					content: settingsStore.systemPrompt,
				});
			}

			// Add conversation history
			baseMessages.push(...conversationHistory);

			// Add current user message
			baseMessages.push({
				role: 'user',
				content,
			});

			// Start parallel streams for all models
			const streamPromises = models.map(async (modelId, index) => {
				const request: ChatCompletionRequest = {
					model: modelId,
					messages: baseMessages,
					temperature: settingsStore.temperature,
					max_tokens: settingsStore.maxTokens,
					top_p: settingsStore.topP,
					stream: true,
				};

				try {
					let tokenCount = 0;
					for await (const chunk of streamCompletion(request)) {
						responses[index].content += chunk;
						tokenCount++;
						onUpdate([...responses]);
					}

					responses[index].isStreaming = false;
					responses[index].endTime = Date.now();

					const durationMs = responses[index].endTime! - responses[index].startTime;
					// Estimate tokens (rough approximation based on whitespace-split words)
					const estimatedTokens = responses[index].content.split(/\s+/).length;

					responses[index].metrics = {
						promptTokens: 0, // Not available from stream
						completionTokens: estimatedTokens,
						totalTokens: estimatedTokens,
						durationMs,
						tokensPerSecond: durationMs > 0 ? (estimatedTokens / durationMs) * 1000 : 0,
					};
				} catch (error) {
					responses[index].isStreaming = false;
					responses[index].error = error instanceof Error ? error.message : 'Unknown error';
					responses[index].endTime = Date.now();
				}

				onUpdate([...responses]);
			});

			await Promise.all(streamPromises);
			return responses;
		},
	};
}

export const comparisonStore = createComparisonStore();
