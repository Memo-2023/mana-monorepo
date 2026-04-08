/**
 * LocalLLMEngineImpl — the actual transformers.js engine.
 *
 * This file is intentionally NOT exported from the package's index.ts.
 * It's loaded only inside the Web Worker (worker.ts), where it owns
 * the model + processor + WebGPU device + tensor work. The main thread
 * never instantiates it directly — instead it talks to a thin
 * `LocalLLMEngine` proxy in engine.ts that postMessages over to the
 * worker.
 *
 * Why the split: model.generate() with a 2B-parameter LLM does heavy
 * synchronous tensor work that blocks the JS thread for 50-200 ms per
 * forward pass. With ~150 forward passes per generation, the main
 * thread would freeze for ~10-30 seconds during a single chat reply.
 * Web Workers run on their own thread, so the main UI stays responsive
 * for scrolling, clicks, and animations while inference is happening.
 *
 * The implementation is otherwise identical to the previous in-thread
 * engine — same two-step tokenization, same aggregated progress, same
 * streaming-or-fallback token counting, same convention quirks for
 * transformers.js v4. See the comment headers in each method for the
 * detailed reasoning behind each non-obvious decision.
 */

import type { GenerateOptions, GenerateResult, LoadingStatus, ModelConfig } from './types';
import { MODELS, DEFAULT_MODEL, type ModelKey } from './models';

type TransformersModule = typeof import('@huggingface/transformers');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyModel = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyProcessor = any;

export class LocalLLMEngineImpl {
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

	static isSupported(): boolean {
		return typeof navigator !== 'undefined' && 'gpu' in navigator;
	}

	async load(model: ModelKey = DEFAULT_MODEL): Promise<void> {
		if (this.model && this.currentModel === model) return;
		if (this.loadPromise && this.currentModel === model) return this.loadPromise;
		if (this.model && this.currentModel !== model) {
			await this.unload();
		}
		this.currentModel = model;
		this.loadPromise = this._load(model);
		return this.loadPromise;
	}

	private async _load(model: ModelKey): Promise<void> {
		if (!LocalLLMEngineImpl.isSupported()) {
			this.setStatus({ state: 'error', error: 'WebGPU not supported in this browser' });
			throw new Error('WebGPU not supported');
		}

		this.setStatus({ state: 'checking' });

		try {
			if (!this.transformers) {
				this.transformers = await import('@huggingface/transformers');
			}
			const config = MODELS[model];

			// Aggregated per-file progress reporting — see the long comment
			// in the previous engine.ts for the rationale.
			const fileProgress = new Map<string, { loaded: number; total: number }>();

			const formatBytes = (bytes: number): string => {
				if (bytes < 1024) return `${bytes} B`;
				if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
				if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
				return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
			};

			const emitAggregate = () => {
				let totalLoaded = 0;
				let totalSize = 0;
				for (const { loaded, total } of fileProgress.values()) {
					totalLoaded += loaded;
					totalSize += total;
				}
				const pct = totalSize > 0 ? totalLoaded / totalSize : 0;
				this.setStatus({
					state: 'downloading',
					progress: pct,
					text:
						totalSize > 0
							? `Downloading model (${(pct * 100).toFixed(0)}%, ${formatBytes(totalLoaded)} / ${formatBytes(totalSize)}, ${fileProgress.size} files)`
							: `Downloading model (${fileProgress.size} files queued)`,
				});
			};

			const progressCallback = (report: {
				status: string;
				file?: string;
				name?: string;
				progress?: number;
				loaded?: number;
				total?: number;
			}) => {
				const file = report.file ?? report.name ?? '_unknown';
				if (report.status === 'initiate') {
					if (!fileProgress.has(file)) fileProgress.set(file, { loaded: 0, total: 0 });
					emitAggregate();
				} else if (report.status === 'download' || report.status === 'progress') {
					fileProgress.set(file, {
						loaded: report.loaded ?? 0,
						total: report.total ?? fileProgress.get(file)?.total ?? 0,
					});
					emitAggregate();
				} else if (report.status === 'done') {
					const existing = fileProgress.get(file);
					if (existing && existing.total > 0) {
						fileProgress.set(file, { loaded: existing.total, total: existing.total });
					}
					emitAggregate();
				}
			};

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

	async unload(): Promise<void> {
		this.model = null;
		this.processor = null;
		this.currentModel = null;
		this.loadPromise = null;
		this.setStatus({ state: 'idle' });
	}

	async generate(options: GenerateOptions): Promise<GenerateResult> {
		if (!this.model || !this.processor) {
			await this.load();
		}

		const start = performance.now();

		// Two-step input prep — see previous engine.ts comment for why we
		// can't use apply_chat_template's all-in-one return_dict mode for
		// Gemma4ForConditionalGeneration.
		const promptText: string = this.processor.apply_chat_template(options.messages, {
			add_generation_prompt: true,
			tokenize: false,
		});

		const inputs = this.processor.tokenizer(promptText, {
			return_tensors: 'pt',
		});

		const promptTokenCount = this.tensorLength(inputs?.input_ids);

		let collectedText = '';
		const transformers = this.transformers as TransformersModule;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const TextStreamer = (transformers as any).TextStreamer;
		const streamer = new TextStreamer(this.processor.tokenizer, {
			skip_prompt: true,
			skip_special_tokens: true,
			callback_function: (text: string) => {
				collectedText += text;
				options.onToken?.(text);
			},
		});

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let generated: any = null;
		try {
			generated = await this.model.generate({
				...inputs,
				max_new_tokens: options.maxTokens ?? 1024,
				temperature: options.temperature ?? 0.7,
				do_sample: (options.temperature ?? 0.7) > 0,
				streamer,
			});
		} catch (err) {
			if (!collectedText) throw err;
		}

		let completionTokenCount = 0;
		try {
			if (generated && generated.dims) {
				const fullSequence = this.tensorRow(generated, 0);
				completionTokenCount = Math.max(0, fullSequence.length - promptTokenCount);
			}
		} catch {
			// fall through to estimate
		}
		if (completionTokenCount === 0 && collectedText) {
			completionTokenCount = Math.ceil(collectedText.length / 4);
		}

		return {
			content: collectedText,
			usage: {
				prompt_tokens: promptTokenCount,
				completion_tokens: completionTokenCount,
				total_tokens: promptTokenCount + completionTokenCount,
			},
			latencyMs: Math.round(performance.now() - start),
		};
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private tensorLength(tensor: any): number {
		if (!tensor || !tensor.dims) return 0;
		return tensor.dims[tensor.dims.length - 1];
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private tensorRow(tensor: any, row: number): number[] {
		const seqLen = tensor.dims[tensor.dims.length - 1];
		const start = row * seqLen;
		return Array.from(tensor.data.slice(start, start + seqLen)) as number[];
	}
}
