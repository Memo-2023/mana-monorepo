/**
 * Reactive scene scope — propagates the active scene's scopeTagIds to
 * module queries so the UI can filter records by the scene's tags.
 *
 * Core filter logic lives in `$lib/data/ai/scope-filter.ts` (shared
 * with the AI scope-context). This file only owns the reactive state
 * + thin wrappers that read it.
 */

import { filterByScopeTagMap, filterByScopeAsync } from '$lib/data/ai/scope-filter';

/** Reactive scope state — set by workbench layout, read by module queries. */
let _scopeTagIds = $state<readonly string[] | undefined>(undefined);

export function setSceneScopeTagIds(tagIds: readonly string[] | undefined): void {
	_scopeTagIds = tagIds?.length ? tagIds : undefined;
}

export function getSceneScopeTagIds(): readonly string[] | undefined {
	return _scopeTagIds;
}

/**
 * Batch filter using a pre-fetched tag map. Preferred for list queries
 * (1 Dexie call instead of N).
 */
export function filterBySceneScopeBatch<T>(
	records: T[],
	getId: (record: T) => string,
	tagMap: Map<string, string[]>
): T[] {
	return filterByScopeTagMap(records, _scopeTagIds, getId, tagMap);
}

/** Legacy per-record variant. Prefer batch for lists. */
export async function filterBySceneScope<T>(
	records: T[],
	getTagIdsForRecord: (record: T) => Promise<string[]>
): Promise<T[]> {
	return filterByScopeAsync(records, _scopeTagIds, getTagIdsForRecord);
}
