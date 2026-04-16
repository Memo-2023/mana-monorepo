/**
 * Ambient scope context for AI tool execution.
 *
 * Two modes:
 *   1. **Explicit** (preferred): call `filterByScopeExplicit()` with
 *      scope passed directly. Race-safe.
 *   2. **Ambient** (convenience for auto-tools): `withAgentScope()`
 *      sets module-level state; `filterByScope()` reads it.
 *
 * Core filter logic lives in `./scope-filter.ts` (shared with scene-scope).
 */

import { filterByScopeAsync } from './scope-filter';

let currentScopeTagIds: readonly string[] | null = null;

/**
 * Run `fn` with the given scope tag IDs as ambient context. NOT safe
 * for concurrent calls — the runner serializes via a mutex.
 */
export async function withAgentScope<T>(
	scopeTagIds: readonly string[] | undefined,
	fn: () => Promise<T>
): Promise<T> {
	const prev = currentScopeTagIds;
	currentScopeTagIds = scopeTagIds?.length ? scopeTagIds : null;
	try {
		return await fn();
	} finally {
		currentScopeTagIds = prev;
	}
}

/** Read the current ambient scope. Null = no filtering. */
export function getAgentScopeTagIds(): readonly string[] | null {
	return currentScopeTagIds;
}

/** Explicit, race-safe variant — pass scope directly. */
export { filterByScopeAsync as filterByScopeExplicit } from './scope-filter';

/** Ambient convenience — reads scope from withAgentScope(). */
export async function filterByScope<T>(
	records: T[],
	getTagIdsForRecord: (record: T) => Promise<string[]>
): Promise<T[]> {
	return filterByScopeAsync(records, currentScopeTagIds, getTagIdsForRecord);
}
