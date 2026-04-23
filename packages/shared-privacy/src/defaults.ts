import type { VisibilityLevel } from './types';

/**
 * Default visibility for newly-created records, derived from the space
 * type. Personal spaces stay `private` so a fresh note or task doesn't
 * accidentally leak to cohabitants of a team space; multi-member spaces
 * (team, club, firma, …) default to `space` so collaboration works
 * without requiring a manual toggle on every write.
 *
 * Accepts `null`/`undefined`/unknown strings and treats them as personal
 * — the safer direction. Callers that know the space type pass it
 * directly; callers that don't (e.g. during sync-apply) fall back to
 * 'private'.
 */
export function defaultVisibilityFor(spaceType: string | null | undefined): VisibilityLevel {
	if (!spaceType) return 'private';
	if (spaceType === 'personal') return 'private';
	// team, club, firma, or any future multi-member type.
	return 'space';
}
