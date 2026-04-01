/**
 * LocalLLMEngine — WebLLM wrapper for client-side inference.
 *
 * Lazy-loads the model on first use, caches weights in browser Cache API.
 * Provides both one-shot and streaming generation.
 */

import type { MLCEngine } from '@mlc-ai/web-llm';
import type { ChatMessage, GenerateOptions, GenerateResult, LoadingStatus } from './types';
import type { ModelConfig } from './types';
import { MODELS, DEFAULT_MODEL, type ModelKey } from './models';

export class LocalLLMEngine {
	private engine: MLCEngine | null = null;
	private loadPromise: Promise<void> | null = null;
	private currentModel: ModelKey | null = null;
	private _status: LoadingStatus = { state: 'idle' };
	private statusListeners: Set<(status: LoadingStatus) => void> = new Set();

	get status(): LoadingStatus {
		return this._status;
	}

	get isReady(): boolean {
		return this._status.state === 'ready';
	}

	get modelConfig(): ModelConfig | null {
		return this.currentModel ? MODELS[this.currentModel] : null;
	}

	/**
	 * Subscribe to status changes (for non-Svelte usage).
	 */
	onStatusChange(listener: (status: LoadingStatus) => void): () => void {
		this.statusListeners.add(listener);
		return () => this.statusListeners.delete(listener);
	}

	private setStatus(status: LoadingStatus) {
		this._status = status;
		for (const listener of this.statusListeners) {
			listener(status);
		}
	}

	/**
	 * Check if WebGPU is available in this browser.
	 */
	static isSupported(): boolean {
		return typeof navigator !== 'undefined' && 'gpu' in navigator;
	}

	/**
	 * Load a model. Idempotent — returns immediately if already loaded.
	 * Model weights are cached in browser Cache API for instant reload.
	 */
	async load(model: ModelKey = DEFAULT_MODEL): Promise<void> {
		// Already loaded with this model
		if (this.engine && this.currentModel === model) return;

		// Already loading
		if (this.loadPromise && this.currentModel === model) return this.loadPromise;

		// Unload previous model if switching
		if (this.engine && this.currentModel !== model) {
			await this.unload();
		}

		this.currentModel = model;
		this.loadPromise = this._load(model);
		return this.loadPromise;
	}

	private async _load(model: ModelKey): Promise<void> {
		if (!LocalLLMEngine.isSupported()) {
			this.setStatus({ state: 'error', error: 'WebGPU not supported in this browser' });
			throw new Error('WebGPU not supported');
		}

		this.setStatus({ state: 'checking' });

		try {
			const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
			const config = MODELS[model];

			this.engine = await CreateMLCEngine(config.modelId, {
				initProgressCallback: (report) => {
					if (report.progress < 1) {
						this.setStatus({
							state: 'downloading',
							progress: report.progress,
							text: report.text,
						});
					} else {
						this.setStatus({ state: 'loading', text: 'Initializing model...' });
					}
				},
			});

			this.setStatus({ state: 'ready' });
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			this.setStatus({ state: 'error', error: message });
			this.loadPromise = null;
			throw err;
		}
	}

	/**
	 * Unload the model and free memory.
	 */
	async unload(): Promise<void> {
		if (this.engine) {
			await this.engine.unload();
			this.engine = null;
		}
		this.currentModel = null;
		this.loadPromise = null;
		this.setStatus({ state: 'idle' });
	}

	/**
	 * Generate a response. Auto-loads the model if not yet loaded.
	 */
	async generate(options: GenerateOptions): Promise<GenerateResult> {
		if (!this.engine) {
			await this.load();
		}

		const start = performance.now();

		if (options.onToken) {
			return this._generateStreaming(options, start);
		}

		const response = await this.engine!.chat.completions.create({
			messages: options.messages,
			temperature: options.temperature ?? 0.7,
			max_tokens: options.maxTokens ?? 1024,
			stream: false,
		});

		const choice = response.choices[0];
		return {
			content: choice.message.content ?? '',
			usage: {
				prompt_tokens: response.usage?.prompt_tokens ?? 0,
				completion_tokens: response.usage?.completion_tokens ?? 0,
				total_tokens: response.usage?.total_tokens ?? 0,
			},
			latencyMs: Math.round(performance.now() - start),
		};
	}

	private async _generateStreaming(
		options: GenerateOptions,
		start: number
	): Promise<GenerateResult> {
		const chunks: string[] = [];
		let usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

		const stream = await this.engine!.chat.completions.create({
			messages: options.messages,
			temperature: options.temperature ?? 0.7,
			max_tokens: options.maxTokens ?? 1024,
			stream: true,
			stream_options: { include_usage: true },
		});

		for await (const chunk of stream) {
			const delta = chunk.choices[0]?.delta?.content;
			if (delta) {
				chunks.push(delta);
				options.onToken!(delta);
			}
			if (chunk.usage) {
				usage = {
					prompt_tokens: chunk.usage.prompt_tokens,
					completion_tokens: chunk.usage.completion_tokens,
					total_tokens: chunk.usage.total_tokens,
				};
			}
		}

		return {
			content: chunks.join(''),
			usage,
			latencyMs: Math.round(performance.now() - start),
		};
	}

	/**
	 * Convenience: single prompt → response.
	 */
	async prompt(
		text: string,
		opts?: { systemPrompt?: string; temperature?: number; maxTokens?: number }
	): Promise<string> {
		const messages: ChatMessage[] = [];
		if (opts?.systemPrompt) {
			messages.push({ role: 'system', content: opts.systemPrompt });
		}
		messages.push({ role: 'user', content: text });

		const result = await this.generate({
			messages,
			temperature: opts?.temperature,
			maxTokens: opts?.maxTokens,
		});
		return result.content;
	}

	/**
	 * Convenience: extract structured JSON from text.
	 */
	async extractJson<T = unknown>(
		text: string,
		instruction: string,
		opts?: { temperature?: number }
	): Promise<T> {
		const result = await this.generate({
			messages: [
				{
					role: 'system',
					content:
						'You are a JSON extraction assistant. Always respond with valid JSON only, no markdown, no explanation.',
				},
				{
					role: 'user',
					content: `${instruction}\n\nText:\n${text}`,
				},
			],
			temperature: opts?.temperature ?? 0.1,
			maxTokens: 2048,
		});

		return JSON.parse(result.content) as T;
	}

	/**
	 * Convenience: classify text into categories.
	 */
	async classify(text: string, categories: string[], opts?: { context?: string }): Promise<string> {
		const categoryList = categories.map((c) => `"${c}"`).join(', ');
		const result = await this.generate({
			messages: [
				{
					role: 'system',
					content: `Classify the text into exactly one of these categories: ${categoryList}. Respond with only the category name, nothing else.${opts?.context ? ` Context: ${opts.context}` : ''}`,
				},
				{ role: 'user', content: text },
			],
			temperature: 0,
			maxTokens: 50,
		});

		const normalized = result.content.trim().replace(/^["']|["']$/g, '');
		// Return the closest matching category
		const match = categories.find((c) => c.toLowerCase() === normalized.toLowerCase());
		return match ?? normalized;
	}
}

/** Singleton instance for app-wide use */
export const localLLM = new LocalLLMEngine();
