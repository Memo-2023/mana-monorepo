/**
 * Visibility filtering for records inside a shared Space.
 *
 * Every record carries `visibility: 'space' | 'private'`. A `private`
 * record is visible only to its `authorId`, even when other members of
 * the same Space could technically read the row. This handles the
 * "draft note in a shared family space" case — the author keeps it
 * hidden until they flip it to 'space'.
 *
 * Sits in a layer above scoped-db: that module enforces space boundaries,
 * this one enforces per-member visibility.
 *
 * See docs/plans/spaces-foundation.md §3.5.
 */

import { getCurrentUserId } from '../current-user';

export type Visibility = 'space' | 'private';

/**
 * Drop private records not authored by the current user from a list.
 * Leaves 'space' records untouched.
 *
 * Runs client-side — the server will enforce the same rule once the
 * sync engine is scope-aware. Until then this is the authoritative
 * check the UI uses to decide what to show.
 */
export function applyVisibility<T extends { visibility?: unknown; authorId?: unknown }>(
	records: T[]
): T[] {
	const me = getCurrentUserId();
	return records.filter((r) => {
		if (r.visibility !== 'private') return true;
		return typeof r.authorId === 'string' && r.authorId === me;
	});
}

/**
 * Predicate for use inside Dexie `.filter()` chains so visibility can be
 * pushed into the query instead of the hot path. Matches the same rule
 * as `applyVisibility`.
 */
export function isVisibleToCurrentUser(record: unknown): boolean {
	const r = record as { visibility?: unknown; authorId?: unknown };
	if (r.visibility !== 'private') return true;
	const me = getCurrentUserId();
	return typeof r.authorId === 'string' && r.authorId === me;
}
