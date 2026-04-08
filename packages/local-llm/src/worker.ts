/**
 * Web Worker entry point for @mana/local-llm.
 *
 * Runs in a Dedicated Worker context, owns a single LocalLLMEngineImpl
 * instance, and exchanges messages with the main thread proxy
 * (engine.ts) over postMessage. The protocol is small and typed:
 *
 * Main → Worker (WorkerRequest):
 *   { id, type: 'load',     modelKey: ModelKey }
 *   { id, type: 'unload' }
 *   { id, type: 'generate', opts: SerializableGenerateOptions }
 *   { id, type: 'isReady' }   — synchronous probe; resolves with bool
 *
 * Worker → Main (WorkerResponse):
 *   { id, type: 'result',    data?: unknown }   — request fulfilled
 *   { id, type: 'error',     message: string }  — request rejected
 *   { id, type: 'token',     token: string }    — streaming token chunk
 *   {     type: 'status',    status: LoadingStatus }  — broadcast, no id
 *
 * Each request has a unique id chosen by the proxy. The worker echoes
 * the id on its result/error/token responses so the proxy can route
 * them back to the right pending Promise + onToken callback. Status
 * messages are broadcast (no id) and trigger every registered status
 * listener on the proxy.
 *
 * Note: this file does NOT import @mana/local-llm's index — it imports
 * engine-impl directly. The package's public surface is the proxy in
 * engine.ts; this file is the worker side of that proxy and lives in
 * its own bundle chunk.
 */

import { LocalLLMEngineImpl } from './engine-impl';
import type { GenerateOptions, LoadingStatus } from './types';
import type { ModelKey } from './models';

// ─── Protocol types (mirrored in engine.ts) ────────────────────

export type SerializableGenerateOptions = Omit<GenerateOptions, 'onToken'>;

export type WorkerRequest =
	| { id: string; type: 'load'; modelKey: ModelKey }
	| { id: string; type: 'unload' }
	| { id: string; type: 'generate'; opts: SerializableGenerateOptions }
	| { id: string; type: 'isReady' };

export type WorkerResponse =
	| { id: string; type: 'result'; data?: unknown }
	| { id: string; type: 'error'; message: string }
	| { id: string; type: 'token'; token: string }
	| { type: 'status'; status: LoadingStatus };

// ─── Worker setup ──────────────────────────────────────────────

const engine = new LocalLLMEngineImpl();

// Forward all status changes to the main thread as broadcast messages.
engine.onStatusChange((status) => {
	postMessage({ type: 'status', status } satisfies WorkerResponse);
});

self.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
	const req = event.data;

	try {
		switch (req.type) {
			case 'load': {
				await engine.load(req.modelKey);
				postMessage({ id: req.id, type: 'result' } satisfies WorkerResponse);
				break;
			}

			case 'unload': {
				await engine.unload();
				postMessage({ id: req.id, type: 'result' } satisfies WorkerResponse);
				break;
			}

			case 'isReady': {
				postMessage({
					id: req.id,
					type: 'result',
					data: engine.isReady,
				} satisfies WorkerResponse);
				break;
			}

			case 'generate': {
				// Re-attach the streaming callback on the worker side. Each
				// emitted token gets posted back to the main thread tagged
				// with the originating request id, so the proxy can route
				// it to the right onToken callback.
				const result = await engine.generate({
					...req.opts,
					onToken: (token) => {
						postMessage({ id: req.id, type: 'token', token } satisfies WorkerResponse);
					},
				});
				postMessage({
					id: req.id,
					type: 'result',
					data: result,
				} satisfies WorkerResponse);
				break;
			}
		}
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		postMessage({ id: req.id, type: 'error', message } satisfies WorkerResponse);
	}
});
