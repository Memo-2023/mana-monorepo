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
import type { ResolvedInput } from './planner/types';

const TABLE = '_aiDebugLog';
const STORAGE_KEY = 'mana.ai.debug';
const MAX_ENTRIES = 50;

/**
 * Captured by `aiPlanTask` and passed back via the planner output so the
 * runner can record it without the planner needing to know about Dexie.
 */
export interface PlannerCallDebug {
	readonly systemPrompt: string;
	readonly userPrompt: string;
	readonly rawResponse: string;
	readonly latencyMs: number;
	readonly backendId?: string;
	readonly model?: string;
}

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
	planner?: PlannerCallDebug;
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

/** Persist one debug entry + trim oldest if over cap. Idempotent on
 *  iterationId — re-running an iteration overwrites the prior capture. */
export async function recordAiDebug(entry: AiDebugEntry): Promise<void> {
	try {
		await db.table<AiDebugEntry>(TABLE).put(entry);
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
