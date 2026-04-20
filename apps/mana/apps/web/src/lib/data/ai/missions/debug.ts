/**
 * AI Mission debug log — per-iteration capture of what the planner saw
 * and what it returned, for debugging / prompt iteration.
 *
 * Local-only (Dexie table `_aiDebugLog`, never synced) because the
 * captured prompt contains the user's resolved inputs, which include
 * decrypted note bodies and goal text. Sending those to the server
 * would defeat the at-rest encryption.
 *
 * Toggled via localStorage flag `mana.ai.debug` ('1' enables). Defaults
 * to enabled in DEV builds and disabled in production. Capped at
 * MAX_ENTRIES newest rows; the writer trims older ones on every insert.
 */

import { useLiveQueryWithDefault } from '@mana/local-store/svelte';
import { db } from '../../database';
import type { ChatMessage, LoopStopReason, ResolvedInput } from '@mana/shared-ai';

const TABLE = '_aiDebugLog';
const STORAGE_KEY = 'mana.ai.debug';
const MAX_ENTRIES = 50;
/** Auto-purge entries older than this to limit exposure of decrypted
 *  content in the local-only table. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
/** Max chars per resolved-input content stored in debug. Longer content
 *  is truncated to reduce the privacy surface if the device is stolen. */
const INPUT_CONTENT_LIMIT = 500;

export interface AiDebugEntry {
	/** Primary key — one row per iteration. */
	iterationId: string;
	missionId: string;
	missionTitle: string;
	missionObjective: string;
	capturedAt: string;
	resolvedInputs: ResolvedInput[];
	preStep: {
		webResearch?: { ok: true; sourceCount: number; summary: string } | { ok: false; error: string };
		kontextInjected: boolean;
	};
	/** Full chat history of the planner loop: system + user + every
	 *  assistant turn (with tool_calls) + every tool-message result.
	 *  Replaces the pre-migration plannerCalls[]/loopSteps structure. */
	messages?: ChatMessage[];
	/** Number of planner rounds consumed inside this iteration. */
	rounds?: number;
	/** Why the loop terminated (assistant-stop, max-rounds, …). */
	stopReason?: LoopStopReason;
	plannerError?: string;
}

/** True when the user has opted in to debug capture. */
export function isAiDebugEnabled(): boolean {
	if (typeof localStorage === 'undefined') return false;
	const raw = localStorage.getItem(STORAGE_KEY);
	if (raw === '1') return true;
	if (raw === '0') return false;
	// Default: on in dev builds, off in prod.
	try {
		return Boolean(import.meta.env?.DEV);
	} catch {
		return false;
	}
}

export function setAiDebugEnabled(enabled: boolean): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0');
}

/** Truncate resolved-input content before persisting so the debug
 *  table doesn't store full decrypted note/kontext bodies at rest. */
function sanitizeForStorage(entry: AiDebugEntry): AiDebugEntry {
	return {
		...entry,
		resolvedInputs: entry.resolvedInputs.map((inp) => ({
			...inp,
			content:
				inp.content.length > INPUT_CONTENT_LIMIT
					? inp.content.slice(0, INPUT_CONTENT_LIMIT) + '\n… (truncated for privacy)'
					: inp.content,
		})),
	};
}

/** Persist one debug entry + trim oldest if over cap + purge old entries.
 *  Idempotent on iterationId — re-running an iteration overwrites prior. */
export async function recordAiDebug(entry: AiDebugEntry): Promise<void> {
	try {
		await db.table<AiDebugEntry>(TABLE).put(sanitizeForStorage(entry));

		// Count-based cap
		const total = await db.table<AiDebugEntry>(TABLE).count();
		if (total > MAX_ENTRIES) {
			const overflow = total - MAX_ENTRIES;
			const oldest = await db
				.table<AiDebugEntry>(TABLE)
				.orderBy('capturedAt')
				.limit(overflow)
				.primaryKeys();
			if (oldest.length) {
				await db.table<AiDebugEntry>(TABLE).bulkDelete(oldest);
			}
		}

		// Time-based purge: drop entries older than MAX_AGE_MS
		const cutoff = new Date(Date.now() - MAX_AGE_MS).toISOString();
		const expired = await db
			.table<AiDebugEntry>(TABLE)
			.where('capturedAt')
			.below(cutoff)
			.primaryKeys();
		if (expired.length) {
			await db.table<AiDebugEntry>(TABLE).bulkDelete(expired);
		}
	} catch (err) {
		console.warn('[AiDebug] persist failed:', err);
	}
}

export async function getAiDebugForIteration(
	iterationId: string
): Promise<AiDebugEntry | undefined> {
	return db.table<AiDebugEntry>(TABLE).get(iterationId);
}

/** Reactive Svelte 5 query — returns the debug entry for an iteration
 *  or `null` while loading / when none exists yet. */
export function useAiDebugForIteration(iterationId: string | null) {
	return useLiveQueryWithDefault(
		async () => {
			if (!iterationId) return null;
			const row = await db.table<AiDebugEntry>(TABLE).get(iterationId);
			return row ?? null;
		},
		null as AiDebugEntry | null
	);
}
