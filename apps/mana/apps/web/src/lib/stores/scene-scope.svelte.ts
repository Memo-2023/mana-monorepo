/**
 * Reactive scene scope — propagates the active scene's scopeTagIds to
 * module queries so the UI can filter records by the scene's tags.
 *
 * Updated by the workbench layout whenever the active scene changes.
 * Module queries read `currentScopeTagIds` and filter accordingly.
 * Undefined = no filtering (everything visible).
 *
 * This is the UI-facing counterpart of the AI-facing `withAgentScope`
 * in `data/ai/scope-context.ts`. Both use the same tag system; the AI
 * scope is ephemeral (duration of a mission run), this one is long-
 * lived (persists as long as the scene is active).
 */

/** Reactive scope state — set by workbench layout, read by module queries. */
let _scopeTagIds = $state<readonly string[] | undefined>(undefined);

/** Set the active scene's scope. Called from the workbench layout
 *  when the active scene changes. Pass undefined to clear. */
export function setSceneScopeTagIds(tagIds: readonly string[] | undefined): void {
	_scopeTagIds = tagIds?.length ? tagIds : undefined;
}

/** Read the current scene scope. Returns undefined when no scope is
 *  active (= show everything). Module queries use this to filter. */
export function getSceneScopeTagIds(): readonly string[] | undefined {
	return _scopeTagIds;
}

/**
 * Utility: filter records by the active scene scope. Same semantics as
 * `filterByScope` in AI scope-context: untagged records pass through,
 * tagged records must match at least one scope tag.
 *
 * Synchronous if tagIds are already loaded; async variant for
 * junction-table lookups (same signature as the AI version).
 */
/**
 * Filter records by the active scene scope using a pre-fetched tag map.
 * Pass the result of `tagOps.getTagIdsForMany(ids)` to avoid N+1 queries.
 *
 * @param getId - extract the record's ID (used as key into tagMap)
 * @param tagMap - Map<entityId, tagId[]> from getTagIdsForMany()
 */
export function filterBySceneScopeBatch<T>(
	records: T[],
	getId: (record: T) => string,
	tagMap: Map<string, string[]>
): T[] {
	const scope = _scopeTagIds;
	if (!scope) return records;

	const scopeSet = new Set(scope);
	return records.filter((r) => {
		const tagIds = tagMap.get(getId(r));
		// Untagged records (not in map or empty) are globally visible
		if (!tagIds || tagIds.length === 0) return true;
		return tagIds.some((id) => scopeSet.has(id));
	});
}

/**
 * Legacy per-record variant. Prefer `filterBySceneScopeBatch` for lists.
 */
export async function filterBySceneScope<T>(
	records: T[],
	getTagIdsForRecord: (record: T) => Promise<string[]>
): Promise<T[]> {
	const scope = _scopeTagIds;
	if (!scope) return records;

	const scopeSet = new Set(scope);
	const results: T[] = [];
	for (const r of records) {
		const tagIds = await getTagIdsForRecord(r);
		if (tagIds.length === 0 || tagIds.some((id) => scopeSet.has(id))) {
			results.push(r);
		}
	}
	return results;
}
