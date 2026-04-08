/**
 * LocalLLMEngine — main-thread proxy for the worker-hosted engine.
 *
 * Public API is intentionally identical to the previous in-thread
 * implementation so existing callers (the /llm-test page, the
 * playground module, @mana/shared-llm's BrowserBackend, the Svelte 5
 * reactive bindings in svelte.svelte.ts) need no changes. Internally
 * every call now goes through a Web Worker — see worker.ts for the
 * other side of the protocol.
 *
 * Why a worker: a 2B-parameter LLM does heavy synchronous tensor work
 * for ~50-200 ms per forward pass. With ~150 forward passes per
 * generation, the main thread would freeze for ~10-30 seconds during
 * a single chat reply. Web Workers run on their own thread, so the
 * main UI stays responsive throughout.
 *
 * The proxy is constructed lazily — the Worker is only instantiated
 * on first method call. This matters for SSR: importing this module
 * during a server render must NOT touch the Worker constructor (which
 * doesn't exist in Node), and lazy construction is the cleanest way
 * to keep import-time side effects to zero.
 */

import { MODELS, DEFAULT_MODEL, type ModelKey } from './models';
import type {
	ChatMessage,
	GenerateOptions,
	GenerateResult,
	LoadingStatus,
	ModelConfig,
} from './types';
import type { SerializableGenerateOptions, WorkerRequest, WorkerResponse } from './worker';

/** Tracking entry for an in-flight worker request. */
interface PendingRequest {
	resolve: (data: unknown) => void;
	reject: (err: Error) => void;
	onToken?: (token: string) => void;
}

/**
 * Distributive Omit — preserves the discriminated union when stripping
 * a key. Plain `Omit<Union, K>` collapses to an intersection in many
 * TS versions and loses the type narrowing on `req.type`. This helper
 * distributes the Omit across each member of the union so postRequest
 * still type-checks at the call sites.
 */
type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;
type WorkerRequestPayload = DistributiveOmit<WorkerRequest, 'id'>;

export class LocalLLMEngine {
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

	/** Check if WebGPU is available. Synchronous and SSR-safe. */
	static isSupported(): boolean {
		return typeof navigator !== 'undefined' && 'gpu' in navigator;
	}

	// ─── Worker management ──────────────────────────────────

	private getWorker(): Worker {
		if (this.worker) return this.worker;

		if (typeof Worker === 'undefined') {
			throw new Error('@mana/local-llm requires a browser environment (Worker is not defined)');
		}

		// `new URL('./worker.ts', import.meta.url)` is Vite's documented
		// pattern for declaring a Web Worker entry. Vite picks this up at
		// build time, splits worker.ts (and its transformers.js dep) into
		// its own chunk, and rewrites the URL to the chunk's hashed path.
		// Outside Vite (raw esbuild, plain Node, etc.) this would fail —
		// but the only consumer of this package is the SvelteKit web app
		// where Vite handles the bundling.
		this.worker = new Worker(new URL('./worker.ts', import.meta.url), {
			type: 'module',
			name: 'mana-local-llm',
		});

		this.worker.addEventListener('message', this.handleWorkerMessage);
		this.worker.addEventListener('error', (e) => {
			// Worker-level fatal error — reject all pending requests.
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

		// Status broadcasts have no id and target every listener.
		if (msg.type === 'status') {
			this.setStatus(msg.status);
			return;
		}

		// Streaming token: route to the matching request's onToken
		// callback if one was registered.
		if (msg.type === 'token') {
			const pending = this.pending.get(msg.id);
			pending?.onToken?.(msg.token);
			return;
		}

		// Result/error: resolve or reject the matching pending Promise.
		const pending = this.pending.get(msg.id);
		if (!pending) return;
		this.pending.delete(msg.id);

		if (msg.type === 'result') {
			pending.resolve(msg.data);
		} else {
			pending.reject(new Error(msg.message));
		}
	};

	private postRequest<T>(req: WorkerRequestPayload, onToken?: (token: string) => void): Promise<T> {
		const id = `${++this.nextId}`;
		const worker = this.getWorker();

		return new Promise<T>((resolve, reject) => {
			this.pending.set(id, {
				resolve: (data) => resolve(data as T),
				reject,
				onToken,
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
		if (!this.worker) return; // never loaded, nothing to do
		await this.postRequest<void>({ type: 'unload' });
		this.currentModel = null;
		// Tear down the worker so a future load() starts a fresh one
		// with cleared GPU buffers. transformers.js doesn't expose an
		// explicit dispose, so terminating the worker is the only way
		// to reliably reclaim VRAM.
		this.worker.terminate();
		this.worker = null;
		this.pending.clear();
	}

	async generate(options: GenerateOptions): Promise<GenerateResult> {
		const { onToken, ...rest } = options;
		const opts: SerializableGenerateOptions = rest;
		return this.postRequest<GenerateResult>({ type: 'generate', opts }, onToken);
	}

	// ─── Convenience wrappers (main thread, build on top of generate) ──

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
		const match = categories.find((c) => c.toLowerCase() === normalized.toLowerCase());
		return match ?? normalized;
	}
}

/** Singleton instance for app-wide use */
export const localLLM = new LocalLLMEngine();
