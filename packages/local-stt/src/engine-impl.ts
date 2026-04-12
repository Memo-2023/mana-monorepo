/**
 * LocalSttEngineImpl — the actual transformers.js Whisper engine.
 *
 * Runs inside a Web Worker (worker.ts). The main thread never
 * instantiates this directly — it talks to a thin proxy in engine.ts
 * that postMessages over to the worker.
 *
 * Whisper processes audio in 30-second chunks. For longer recordings
 * the pipeline handles chunking internally via `chunk_length_s`.
 * We expose pseudo-streaming by forwarding each chunk's text via
 * the onChunk callback as it completes.
 */

import type {
	TranscribeOptions,
	TranscribeResult,
	TranscribeSegment,
	LoadingStatus,
	SttModelConfig,
} from './types';
import { MODELS, DEFAULT_MODEL, type ModelKey } from './models';

type TransformersModule = typeof import('@huggingface/transformers');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPipeline = any;

export class LocalSttEngineImpl {
	private pipeline: AnyPipeline = null;
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

	get modelConfig(): SttModelConfig | null {
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
		if (this.pipeline && this.currentModel === model) return;
		if (this.loadPromise && this.currentModel === model) return this.loadPromise;
		if (this.pipeline && this.currentModel !== model) {
			await this.unload();
		}
		this.currentModel = model;
		this.loadPromise = this._load(model);
		return this.loadPromise;
	}

	private async _load(model: ModelKey): Promise<void> {
		this.setStatus({ state: 'checking' });

		try {
			if (!this.transformers) {
				this.transformers = await import('@huggingface/transformers');
			}

			const config = MODELS[model];

			// Aggregated download progress tracking (same pattern as local-llm).
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
							? `Downloading model (${(pct * 100).toFixed(0)}%, ${formatBytes(totalLoaded)} / ${formatBytes(totalSize)})`
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

			this.setStatus({ state: 'loading', text: 'Loading Whisper pipeline…' });

			// Use transformers.js pipeline() API for automatic-speech-recognition.
			// This handles model + processor + tokenizer loading in one call.
			// Device selection: try WebGPU first, fall back to WASM.
			const device = LocalSttEngineImpl.isSupported() ? 'webgpu' : 'wasm';

			this.pipeline = await this.transformers.pipeline(
				'automatic-speech-recognition',
				config.modelId,
				{
					dtype: config.dtype,
					device,
					progress_callback: progressCallback,
				}
			);

			this.setStatus({ state: 'ready' });
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			this.setStatus({ state: 'error', error: message });
			this.loadPromise = null;
			throw err;
		}
	}

	async unload(): Promise<void> {
		this.pipeline = null;
		this.currentModel = null;
		this.loadPromise = null;
		this.setStatus({ state: 'idle' });
	}

	async transcribe(options: TranscribeOptions): Promise<TranscribeResult> {
		if (!this.pipeline) {
			await this.load();
		}

		const start = performance.now();

		// Build pipeline options.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const pipelineOpts: Record<string, any> = {
			// Chunk long audio into 30s segments with 5s stride overlap.
			chunk_length_s: 30,
			stride_length_s: 5,
			// Return timestamps if requested.
			return_timestamps: options.timestamps ? true : false,
		};

		if (options.language) {
			pipelineOpts.language = options.language;
		}

		// Callback for pseudo-streaming: transformers.js emits partial
		// results per chunk via the `chunk_callback` option.
		if (options.onChunk) {
			const onChunk = options.onChunk;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			pipelineOpts.chunk_callback = (chunk: any) => {
				if (chunk?.text) {
					onChunk(chunk.text);
				}
			};
		}

		// Run the pipeline. Input is Float32Array of 16kHz mono PCM.
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const output: any = await this.pipeline(options.audio, pipelineOpts);

		const latencyMs = Math.round(performance.now() - start);

		// Parse output — the pipeline returns { text, chunks? } for
		// automatic-speech-recognition with return_timestamps.
		const text: string = output.text ?? '';
		const language: string = options.language ?? 'auto';

		let segments: TranscribeSegment[] | undefined;
		if (options.timestamps && output.chunks) {
			segments = output.chunks.map(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(c: any) => ({
					start: c.timestamp?.[0] ?? 0,
					end: c.timestamp?.[1] ?? 0,
					text: c.text ?? '',
				})
			);
		}

		return { text, language, segments, latencyMs };
	}
}
