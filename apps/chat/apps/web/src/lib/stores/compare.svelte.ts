/**
 * Compare Store - Manages model comparison state using Svelte 5 runes
 */

import { chatService } from '$lib/services/chat';
import type { AIModel, CompareModelResult, CompareModelStatus, ChatMessage } from '@chat/types';

// State
let results = $state<CompareModelResult[]>([]);
let prompt = $state('');
let temperature = $state(0.7);
let maxTokens = $state(1024);
let isRunning = $state(false);
let currentIndex = $state(0);
let abortController = $state<AbortController | null>(null);

export const compareStore = {
	// Getters
	get results() {
		return results;
	},
	get prompt() {
		return prompt;
	},
	get temperature() {
		return temperature;
	},
	get maxTokens() {
		return maxTokens;
	},
	get isRunning() {
		return isRunning;
	},
	get currentIndex() {
		return currentIndex;
	},
	get totalModels() {
		return results.length;
	},
	get completedCount() {
		return results.filter((r) => r.status === 'complete' || r.status === 'error').length;
	},
	get currentModelName() {
		const current = results[currentIndex];
		return current?.modelName || '';
	},
	get progress() {
		if (results.length === 0) return 0;
		return (this.completedCount / results.length) * 100;
	},

	// Setters
	setPrompt(value: string) {
		prompt = value;
	},
	setTemperature(value: number) {
		temperature = value;
	},
	setMaxTokens(value: number) {
		maxTokens = value;
	},

	// Actions
	async startComparison(models: AIModel[]) {
		if (isRunning || !prompt.trim() || models.length === 0) return;

		isRunning = true;
		currentIndex = 0;
		abortController = new AbortController();

		// Initialize results with pending status
		results = models.map((model) => ({
			modelId: model.id,
			modelName: model.name,
			status: 'pending' as CompareModelStatus,
		}));

		// Process models sequentially
		for (let i = 0; i < models.length; i++) {
			if (abortController?.signal.aborted) break;

			currentIndex = i;
			const model = models[i];

			// Update status to loading
			results = results.map((r, idx) =>
				idx === i ? { ...r, status: 'loading' as CompareModelStatus } : r
			);

			const startTime = Date.now();

			try {
				const messages: ChatMessage[] = [{ role: 'user', content: prompt }];

				const response = await chatService.createCompletion({
					messages,
					modelId: model.id,
					temperature,
					maxTokens,
				});

				const duration = Date.now() - startTime;

				if (abortController?.signal.aborted) break;

				if (response) {
					results = results.map((r, idx) =>
						idx === i
							? {
									...r,
									status: 'complete' as CompareModelStatus,
									response: response.content,
									duration,
									usage: response.usage,
								}
							: r
					);
				} else {
					results = results.map((r, idx) =>
						idx === i
							? {
									...r,
									status: 'error' as CompareModelStatus,
									error: 'Keine Antwort erhalten',
									duration,
								}
							: r
					);
				}
			} catch (e) {
				const duration = Date.now() - startTime;
				if (!abortController?.signal.aborted) {
					results = results.map((r, idx) =>
						idx === i
							? {
									...r,
									status: 'error' as CompareModelStatus,
									error: e instanceof Error ? e.message : 'Unbekannter Fehler',
									duration,
								}
							: r
					);
				}
			}
		}

		isRunning = false;
		abortController = null;
	},

	cancelComparison() {
		if (abortController) {
			abortController.abort();
			abortController = null;
		}
		isRunning = false;

		// Mark remaining pending/loading items as cancelled
		results = results.map((r) =>
			r.status === 'pending' || r.status === 'loading'
				? { ...r, status: 'error' as CompareModelStatus, error: 'Abgebrochen' }
				: r
		);
	},

	reset() {
		results = [];
		prompt = '';
		temperature = 0.7;
		maxTokens = 1024;
		isRunning = false;
		currentIndex = 0;
		if (abortController) {
			abortController.abort();
			abortController = null;
		}
	},

	clearResults() {
		results = [];
		currentIndex = 0;
	},
};
