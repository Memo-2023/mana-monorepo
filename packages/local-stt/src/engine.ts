/**
 * LocalSttEngine — main-thread proxy for the worker-hosted Whisper engine.
 *
 * Public API mirrors the engine-impl but all work happens in a Web Worker
 * so audio processing doesn't block the UI thread.
 *
 * Lazy construction: the Worker is only instantiated on first method call.
 * This keeps import-time side effects to zero (SSR-safe).
 */

import { MODELS, DEFAULT_MODEL, type ModelKey } from './models';
import type { TranscribeOptions, TranscribeResult, LoadingStatus, SttModelConfig } from './types';
import type { SerializableTranscribeOptions, WorkerRequest, WorkerResponse } from './worker';

interface PendingRequest {
	resolve: (data: unknown) => void;
	reject: (err: Error) => void;
	onChunk?: (text: string) => void;
}

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;
type WorkerRequestPayload = DistributiveOmit<WorkerRequest, 'id'>;

export class LocalSttEngine {
	private worker: Worker | null = null;
	private pending = new Map<string, PendingRequest>();
	private nextId = 0;
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

	// ─── Worker management ──────────────────────────────────

	private getWorker(): Worker {
		if (this.worker) return this.worker;

		if (typeof Worker === 'undefined') {
			throw new Error('@mana/local-stt requires a browser environment (Worker is not defined)');
		}

		this.worker = new Worker(new URL('./worker.ts', import.meta.url), {
			type: 'module',
			name: 'mana-local-stt',
		});

		this.worker.addEventListener('message', this.handleWorkerMessage);
		this.worker.addEventListener('error', (e) => {
			const message = e.message || 'Worker crashed';
			for (const [id, p] of this.pending) {
				p.reject(new Error(`Worker error: ${message}`));
				this.pending.delete(id);
			}
			this.setStatus({ state: 'error', error: message });
		});

		return this.worker;
	}

	private handleWorkerMessage = (event: MessageEvent<WorkerResponse>) => {
		const msg = event.data;

		if (msg.type === 'status') {
			this.setStatus(msg.status);
			return;
		}

		if (msg.type === 'chunk') {
			const pending = this.pending.get(msg.id);
			pending?.onChunk?.(msg.text);
			return;
		}

		const pending = this.pending.get(msg.id);
		if (!pending) return;
		this.pending.delete(msg.id);

		if (msg.type === 'result') {
			pending.resolve(msg.data);
		} else {
			pending.reject(new Error(msg.message));
		}
	};

	private postRequest<T>(req: WorkerRequestPayload, onChunk?: (text: string) => void): Promise<T> {
		const id = `${++this.nextId}`;
		const worker = this.getWorker();

		return new Promise<T>((resolve, reject) => {
			this.pending.set(id, {
				resolve: (data) => resolve(data as T),
				reject,
				onChunk,
			});
			worker.postMessage({ ...req, id } as WorkerRequest);
		});
	}

	// ─── Public API ──────────────────────────────────────────

	async load(model: ModelKey = DEFAULT_MODEL): Promise<void> {
		if (this.currentModel === model && this.isReady) return;
		this.currentModel = model;
		await this.postRequest<void>({ type: 'load', modelKey: model });
	}

	async unload(): Promise<void> {
		if (!this.worker) return;
		await this.postRequest<void>({ type: 'unload' });
		this.currentModel = null;
		this.worker.terminate();
		this.worker = null;
		this.pending.clear();
	}

	async transcribe(options: TranscribeOptions): Promise<TranscribeResult> {
		const { onChunk, ...rest } = options;
		const opts: SerializableTranscribeOptions = rest;
		return this.postRequest<TranscribeResult>({ type: 'transcribe', opts }, onChunk);
	}
}

/** Singleton instance for app-wide use */
export const localSTT = new LocalSttEngine();
