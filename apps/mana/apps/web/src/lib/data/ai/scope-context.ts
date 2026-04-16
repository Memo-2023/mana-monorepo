/**
 * Ambient scope context for AI tool execution.
 *
 * When a mission runs under an agent with scopeTagIds, the runner calls
 * `withAgentScope(tagIds, fn)` around the reasoning loop. Auto-tools
 * like `list_notes` check `getAgentScopeTagIds()` and filter their
 * results to records tagged with at least one of those IDs (plus
 * untagged records, which are globally visible).
 *
 * Pattern mirrors `runAs()` in events/actor.ts — module-level mutable
 * state, single-threaded browser runtime, scoped via try/finally.
 */

let currentScopeTagIds: readonly string[] | null = null;

/**
 * Run `fn` with the given scope tag IDs as ambient context. Clears
 * the scope when `fn` completes (or throws).
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

/**
 * Read the current ambient scope. Returns null when no scope is set
 * (meaning the tool should return everything — General-Agent behavior).
 */
export function getAgentScopeTagIds(): readonly string[] | null {
	return currentScopeTagIds;
}

/**
 * Given a list of records + a function that returns their tag IDs,
 * filter down to records that match the ambient scope. Records with
 * no tags pass through (globally visible).
 */
export async function filterByScope<T>(
	records: T[],
	getTagIdsForRecord: (record: T) => Promise<string[]>
): Promise<T[]> {
	const scope = currentScopeTagIds;
	if (!scope) return records; // no scope = everything visible

	const scopeSet = new Set(scope);
	const results: T[] = [];
	for (const r of records) {
		const tagIds = await getTagIdsForRecord(r);
		// Untagged records are globally visible; tagged records must match scope
		if (tagIds.length === 0 || tagIds.some((id) => scopeSet.has(id))) {
			results.push(r);
		}
	}
	return results;
}
