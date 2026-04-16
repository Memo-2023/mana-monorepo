/**
 * Scope filtering for AI tool execution.
 *
 * Two modes:
 *   1. **Explicit** (preferred): pass `scopeTagIds` directly to
 *      `filterByScopeExplicit()`. Race-safe because no shared state.
 *   2. **Ambient** (convenience for auto-tools): `withAgentScope()`
 *      sets module-level state; `filterByScope()` reads it. Safe only
 *      when missions don't run concurrently — the runner must serialize.
 *
 * Callers that already have the scope (e.g. the reasoning loop itself)
 * should use the explicit variant. Auto-tools that don't receive scope
 * as a parameter use the ambient variant.
 */

let currentScopeTagIds: readonly string[] | null = null;

/**
 * Run `fn` with the given scope tag IDs as ambient context. Clears
 * the scope when `fn` completes (or throws). NOT safe for concurrent
 * calls — use the mutex in runMission or serialize callers.
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

/**
 * Core filter: keep records whose tags overlap with `scopeTagIds`.
 * Untagged records (tagIds=[]) always pass through (globally visible).
 * When `scopeTagIds` is null/empty, returns all records (no filtering).
 *
 * This is the explicit, race-safe variant — pass scope directly.
 */
export async function filterByScopeExplicit<T>(
	records: T[],
	scopeTagIds: readonly string[] | null | undefined,
	getTagIdsForRecord: (record: T) => Promise<string[]>
): Promise<T[]> {
	if (!scopeTagIds?.length) return records;

	const scopeSet = new Set(scopeTagIds);
	const results: T[] = [];
	for (const r of records) {
		const tagIds = await getTagIdsForRecord(r);
		if (tagIds.length === 0 || tagIds.some((id) => scopeSet.has(id))) {
			results.push(r);
		}
	}
	return results;
}

/**
 * Convenience wrapper: reads the ambient scope from `withAgentScope()`.
 * Use this in auto-tools that don't receive scope explicitly.
 */
export async function filterByScope<T>(
	records: T[],
	getTagIdsForRecord: (record: T) => Promise<string[]>
): Promise<T[]> {
	return filterByScopeExplicit(records, currentScopeTagIds, getTagIdsForRecord);
}
