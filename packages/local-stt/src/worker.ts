/**
 * Web Worker entry point for @mana/local-stt.
 *
 * Runs in a Dedicated Worker context, owns a single LocalSttEngineImpl
 * instance, and exchanges messages with the main thread proxy (engine.ts).
 *
 * Protocol:
 *
 * Main → Worker (WorkerRequest):
 *   { id, type: 'load',       modelKey: ModelKey }
 *   { id, type: 'unload' }
 *   { id, type: 'transcribe', opts: SerializableTranscribeOptions }
 *   { id, type: 'isReady' }
 *
 * Worker → Main (WorkerResponse):
 *   { id, type: 'result',  data?: unknown }
 *   { id, type: 'error',   message: string }
 *   { id, type: 'chunk',   text: string }       — streaming chunk
 *   {     type: 'status',  status: LoadingStatus }  — broadcast, no id
 */

import { LocalSttEngineImpl } from './engine-impl';
import type { LoadingStatus, TranscribeOptions } from './types';
import type { ModelKey } from './models';

// ─── Protocol types (mirrored in engine.ts) ────────────────────

export type SerializableTranscribeOptions = Omit<TranscribeOptions, 'onChunk'>;

export type WorkerRequest =
	| { id: string; type: 'load'; modelKey: ModelKey }
	| { id: string; type: 'unload' }
	| { id: string; type: 'transcribe'; opts: SerializableTranscribeOptions }
	| { id: string; type: 'isReady' };

export type WorkerResponse =
	| { id: string; type: 'result'; data?: unknown }
	| { id: string; type: 'error'; message: string }
	| { id: string; type: 'chunk'; text: string }
	| { type: 'status'; status: LoadingStatus };

// ─── Worker setup ──────────────────────────────────────────────

const engine = new LocalSttEngineImpl();

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

			case 'transcribe': {
				const result = await engine.transcribe({
					...req.opts,
					onChunk: (text) => {
						postMessage({ id: req.id, type: 'chunk', text } satisfies WorkerResponse);
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
