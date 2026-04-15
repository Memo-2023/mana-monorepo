/**
 * Research API client — talks to mana-api `/api/v1/research/*`.
 *
 * Backed by the unified deep-research pipeline (mana-search retrieval +
 * mana-llm synthesis). See apps/api/src/modules/research/ for the server.
 *
 * The streaming endpoint uses `fetch` + a ReadableStream parser instead of
 * `EventSource` because EventSource cannot send Authorization headers,
 * and we don't want to leak the JWT into a query string.
 */

import { authStore } from '$lib/stores/auth.svelte';
import { getManaApiUrl } from './config';

// ─── Types — mirror apps/api/src/modules/research/{schema,orchestrator}.ts

export type ResearchDepth = 'quick' | 'standard' | 'deep';

export type ResearchStatus =
	| 'planning'
	| 'searching'
	| 'extracting'
	| 'synthesizing'
	| 'done'
	| 'error';

export interface ResearchResult {
	id: string;
	userId: string;
	questionId: string;
	depth: ResearchDepth;
	status: ResearchStatus;
	subQueries: string[] | null;
	summary: string | null;
	keyPoints: string[] | null;
	followUpQuestions: string[] | null;
	errorMessage: string | null;
	startedAt: string;
	finishedAt: string | null;
}

export interface ResearchSource {
	id: string;
	researchResultId: string;
	url: string;
	title: string | null;
	snippet: string | null;
	extractedContent: string | null;
	category: string | null;
	rank: number;
	createdAt: string;
}

export interface StartResearchInput {
	questionId: string;
	title: string;
	description?: string;
	depth: ResearchDepth;
}

/**
 * Live progress events forwarded from the server pubsub. Mirrors the
 * `ProgressEvent` union in apps/api/src/modules/research/orchestrator.ts.
 *
 * `snapshot` is a synthetic event the server emits once at the start of
 * the SSE stream so late subscribers see the current DB state immediately.
 */
export type ResearchEvent =
	| { type: 'snapshot'; snapshot: ResearchResult }
	| { type: 'status'; status: 'planning' | 'searching' | 'extracting' | 'synthesizing' }
	| { type: 'plan'; subQueries: string[] }
	| { type: 'sources'; count: number }
	| { type: 'token'; delta: string }
	| { type: 'done'; researchResultId: string }
	| { type: 'error'; message: string };

export class ResearchApiError extends Error {
	constructor(
		message: string,
		public readonly status?: number
	) {
		super(message);
		this.name = 'ResearchApiError';
	}
}

// ─── Internal helpers ───────────────────────────────────────

async function authHeaders(extra: HeadersInit = {}): Promise<HeadersInit> {
	const token = await authStore.getValidToken();
	return {
		'Content-Type': 'application/json',
		...(token ? { Authorization: `Bearer ${token}` } : {}),
		...extra,
	};
}

async function jsonRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
	const res = await fetch(`${getManaApiUrl()}${path}`, {
		...init,
		headers: await authHeaders(init.headers),
	});

	if (!res.ok) {
		const body = await res.text().catch(() => '');

		// Special-case the structured errorResponse() body so the UI can
		// show a friendly message for the most common failure modes.
		if (res.status === 402) {
			try {
				const parsed = JSON.parse(body) as {
					details?: { required?: number; available?: number };
				};
				const required = parsed.details?.required;
				const available = parsed.details?.available;
				if (required !== undefined) {
					throw new ResearchApiError(
						`Nicht genug Credits (benötigt: ${required}, verfügbar: ${available ?? 0})`,
						402
					);
				}
			} catch (err) {
				if (err instanceof ResearchApiError) throw err;
				// Fall through to generic message
			}
			throw new ResearchApiError('Nicht genug Credits für diese Recherche', 402);
		}

		throw new ResearchApiError(`mana-api ${path} returned ${res.status}: ${body}`, res.status);
	}

	return (await res.json()) as T;
}

// ─── Public API ─────────────────────────────────────────────

export const researchApi = {
	/**
	 * Kick off a research run. Returns immediately with the new
	 * researchResultId — the pipeline runs in the background.
	 */
	async start(input: StartResearchInput): Promise<{ researchResultId: string }> {
		return jsonRequest('/api/v1/research/start', {
			method: 'POST',
			body: JSON.stringify(input),
		});
	},

	/**
	 * Synchronous variant — blocks until the pipeline is done. Used by the
	 * AI Mission runner for its web-research pre-step where we need the
	 * sources synchronously before handing off to the planner.
	 */
	async startSync(input: StartResearchInput): Promise<ResearchResult> {
		return jsonRequest('/api/v1/research/start-sync', {
			method: 'POST',
			body: JSON.stringify(input),
		});
	},

	/** Fetch a single research result row by id. */
	async get(researchResultId: string): Promise<ResearchResult> {
		return jsonRequest(`/api/v1/research/${researchResultId}`);
	},

	/** Fetch all sources consumed by a research run, ordered by rank. */
	async listSources(researchResultId: string): Promise<ResearchSource[]> {
		const body = await jsonRequest<{ items: ResearchSource[] } | ResearchSource[]>(
			`/api/v1/research/${researchResultId}/sources`
		);
		// listResponse() in apps/api wraps results as { items, total } —
		// fall back to a bare array for forward-compat.
		if (Array.isArray(body)) return body;
		return body.items ?? [];
	},

	/**
	 * Subscribe to live progress for a research run. Calls onEvent for
	 * each parsed SSE event. Returns a cleanup function that aborts the
	 * underlying fetch.
	 *
	 * Uses fetch+ReadableStream rather than EventSource so we can attach
	 * the JWT via Authorization header.
	 */
	streamProgress(researchResultId: string, onEvent: (event: ResearchEvent) => void): () => void {
		const controller = new AbortController();

		void (async () => {
			try {
				const res = await fetch(`${getManaApiUrl()}/api/v1/research/${researchResultId}/stream`, {
					headers: await authHeaders({ Accept: 'text/event-stream' }),
					signal: controller.signal,
				});

				if (!res.ok || !res.body) {
					onEvent({
						type: 'error',
						message: `Stream connect failed: ${res.status}`,
					});
					return;
				}

				const reader = res.body.getReader();
				const decoder = new TextDecoder();
				let buffer = '';

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;
					buffer += decoder.decode(value, { stream: true });

					// SSE frames are separated by blank lines.
					let sep: number;
					while ((sep = buffer.indexOf('\n\n')) !== -1) {
						const frame = buffer.slice(0, sep);
						buffer = buffer.slice(sep + 2);
						const parsed = parseSseFrame(frame);
						if (parsed) onEvent(parsed);
					}
				}
			} catch (err) {
				if ((err as Error).name === 'AbortError') return;
				onEvent({
					type: 'error',
					message: (err as Error).message ?? 'stream failed',
				});
			}
		})();

		return () => controller.abort();
	},
};

/**
 * Parse a single SSE frame (one or more `event:` / `data:` lines) into a
 * ResearchEvent. Returns null for keepalives, comments, or unknown shapes.
 *
 * The server always emits both an `event:` line (the type) and a `data:`
 * line (JSON-encoded full event). The data field is the source of truth
 * — we use the event line only as a sanity check.
 */
function parseSseFrame(frame: string): ResearchEvent | null {
	let dataLine = '';
	let eventLine = '';
	for (const line of frame.split('\n')) {
		if (line.startsWith('data:')) dataLine = line.slice(5).trim();
		else if (line.startsWith('event:')) eventLine = line.slice(6).trim();
	}
	if (!dataLine) return null;

	try {
		const parsed = JSON.parse(dataLine) as Record<string, unknown>;

		// snapshot uses a non-discriminated DB row shape — wrap it.
		if (eventLine === 'snapshot') {
			return { type: 'snapshot', snapshot: parsed as unknown as ResearchResult };
		}

		// All other events already carry their `type` field.
		if (typeof parsed.type === 'string') {
			return parsed as unknown as ResearchEvent;
		}
	} catch {
		// malformed frame — ignore
	}
	return null;
}
