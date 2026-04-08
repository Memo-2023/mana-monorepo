/**
 * LocalLLMEngine — transformers.js wrapper for client-side inference.
 *
 * Lazy-loads a HuggingFace ONNX model on first use, caches weights in the
 * browser's Cache API, and runs inference on the WebGPU backend.
 *
 * The default model is Google's Gemma 4 E2B (`onnx-community/gemma-4-E2B-it-ONNX`,
 * q4f16). The external API of this class is intentionally identical to the
 * previous WebLLM implementation so callers (Svelte stores, /llm-test page,
 * playground module) need no changes when the underlying engine swaps.
 */

import type { ChatMessage, GenerateOptions, GenerateResult, LoadingStatus } from './types';
import type { ModelConfig } from './types';
import { MODELS, DEFAULT_MODEL, type ModelKey } from './models';

// transformers.js types are minimal here on purpose. The library does not
// publish first-class TS types for every model class, and we never expose
// these objects past this file — the public surface (LocalLLMEngine methods)
// is fully typed via our own GenerateResult / LoadingStatus etc.
type TransformersModule = typeof import('@huggingface/transformers');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyModel = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyProcessor = any;

export class LocalLLMEngine {
	private model: AnyModel = null;
	private processor: AnyProcessor = null;
	private transformers: TransformersModule | null = null;
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
	 * Model weights are cached in the browser Cache API for instant reload.
	 */
	async load(model: ModelKey = DEFAULT_MODEL): Promise<void> {
		// Already loaded with this model
		if (this.model && this.currentModel === model) return;

		// Already loading
		if (this.loadPromise && this.currentModel === model) return this.loadPromise;

		// Unload previous model if switching
		if (this.model && this.currentModel !== model) {
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
			if (!this.transformers) {
				this.transformers = await import('@huggingface/transformers');
			}
			const config = MODELS[model];

			// transformers.js progress callback shape:
			//   { status: 'initiate'|'download'|'progress'|'done'|'ready',
			//     name?: string, file?: string, progress?: number, loaded?: number, total?: number }
			// We collapse it into our LoadingStatus union.
			const progressCallback = (report: {
				status: string;
				file?: string;
				name?: string;
				progress?: number;
				loaded?: number;
				total?: number;
			}) => {
				const label = report.file ?? report.name ?? '';
				if (report.status === 'progress' || report.status === 'download') {
					const pct = typeof report.progress === 'number' ? report.progress : 0;
					this.setStatus({
						state: 'downloading',
						progress: pct / 100,
						text: label
							? `Downloading ${label} (${pct.toFixed(0)}%)`
							: `Downloading (${pct.toFixed(0)}%)`,
					});
				} else if (report.status === 'initiate') {
					this.setStatus({ state: 'downloading', progress: 0, text: `Starting ${label}` });
				} else if (report.status === 'done') {
					this.setStatus({ state: 'loading', text: label ? `Loaded ${label}` : 'Loaded shard' });
				}
				// 'ready' is handled below after both processor + model finish
			};

			// AutoProcessor wraps tokenizer + image/audio preprocessors. For
			// our text-only chat path we use the wrapped tokenizer's
			// apply_chat_template, but loading the full processor is the
			// path the model card documents and avoids architecture-specific
			// special-casing.
			const { AutoProcessor, Gemma4ForConditionalGeneration } = this.transformers as unknown as {
				AutoProcessor: { from_pretrained(id: string, opts?: unknown): Promise<AnyProcessor> };
				Gemma4ForConditionalGeneration: {
					from_pretrained(id: string, opts?: unknown): Promise<AnyModel>;
				};
			};

			this.processor = await AutoProcessor.from_pretrained(config.modelId, {
				progress_callback: progressCallback,
			});
			this.model = await Gemma4ForConditionalGeneration.from_pretrained(config.modelId, {
				dtype: config.dtype,
				device: 'webgpu',
				progress_callback: progressCallback,
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
	 * Unload the model and free GPU memory.
	 */
	async unload(): Promise<void> {
		// transformers.js doesn't expose an explicit dispose() yet — dropping
		// the references and letting the runtime/GC clean up is the
		// recommended path. The WebGPU buffers are tied to the model object
		// and get released when it's no longer reachable.
		this.model = null;
		this.processor = null;
		this.currentModel = null;
		this.loadPromise = null;
		this.setStatus({ state: 'idle' });
	}

	/**
	 * Generate a response. Auto-loads the model if not yet loaded.
	 */
	async generate(options: GenerateOptions): Promise<GenerateResult> {
		if (!this.model || !this.processor) {
			await this.load();
		}

		const start = performance.now();

		// Apply Gemma's chat template via the processor's tokenizer wrapper.
		// `add_generation_prompt: true` appends the tokens that tell the model
		// "now generate an assistant turn".
		const inputs = await this.processor.apply_chat_template(options.messages, {
			add_generation_prompt: true,
			return_dict: true,
			return_tensor: 'pt',
		});

		const promptTokenCount = this.tensorLength(inputs.input_ids);

		// Streaming via TextStreamer if requested
		let streamer: unknown = undefined;
		if (options.onToken) {
			const transformers = this.transformers as TransformersModule;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const TextStreamer = (transformers as any).TextStreamer;
			streamer = new TextStreamer(this.processor.tokenizer, {
				skip_prompt: true,
				skip_special_tokens: true,
				callback_function: (text: string) => {
					options.onToken!(text);
				},
			});
		}

		const generated = await this.model.generate({
			...inputs,
			max_new_tokens: options.maxTokens ?? 1024,
			temperature: options.temperature ?? 0.7,
			do_sample: (options.temperature ?? 0.7) > 0,
			streamer,
		});

		// `generated` is a tensor with shape [batch, seq_len_with_prompt].
		// We slice off the prompt portion to get just the new tokens.
		const fullSequence = this.tensorRow(generated, 0);
		const newTokens = fullSequence.slice(promptTokenCount);
		const completionTokenCount = newTokens.length;

		const content: string = this.processor.tokenizer.decode(newTokens, {
			skip_special_tokens: true,
		});

		return {
			content,
			usage: {
				prompt_tokens: promptTokenCount,
				completion_tokens: completionTokenCount,
				total_tokens: promptTokenCount + completionTokenCount,
			},
			latencyMs: Math.round(performance.now() - start),
		};
	}

	/**
	 * Helper: extract the seq-length of a transformers.js Tensor.
	 * The tensors expose `.dims` ([batch, seq_len]) and `.data` (TypedArray).
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private tensorLength(tensor: any): number {
		if (!tensor || !tensor.dims) return 0;
		return tensor.dims[tensor.dims.length - 1];
	}

	/**
	 * Helper: extract row N of a 2D tensor as a number array.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private tensorRow(tensor: any, row: number): number[] {
		const seqLen = tensor.dims[tensor.dims.length - 1];
		const start = row * seqLen;
		return Array.from(tensor.data.slice(start, start + seqLen)) as number[];
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
