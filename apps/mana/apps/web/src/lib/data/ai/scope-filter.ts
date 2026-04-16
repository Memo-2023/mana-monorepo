/**
 * Pure scope-filter primitives — shared between AI scope-context
 * (ephemeral, per-mission) and scene-scope (long-lived, per-scene).
 *
 * Rule: untagged records (no tags) are always globally visible.
 * Tagged records must match at least one scope tag.
 */

/**
 * Synchronous batch filter using a pre-fetched tag map.
 * Use when you've already called getTagIdsForMany().
 */
export function filterByScopeTagMap<T>(
	records: T[],
	scopeTagIds: readonly string[] | null | undefined,
	getId: (record: T) => string,
	tagMap: Map<string, string[]>
): T[] {
	if (!scopeTagIds?.length) return records;
	const scopeSet = new Set(scopeTagIds);
	return records.filter((r) => {
		const tagIds = tagMap.get(getId(r));
		if (!tagIds || tagIds.length === 0) return true; // untagged = global
		return tagIds.some((id) => scopeSet.has(id));
	});
}

/**
 * Async per-record filter for callers that don't have a pre-fetched map.
 */
export async function filterByScopeAsync<T>(
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
