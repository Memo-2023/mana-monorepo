import type { VisibilityLevel } from './types';

/**
 * Can this record be embedded on a published website? This is the
 * strictest exposure — a public website snapshot is readable by any
 * anonymous visitor, so gate hard on `public` only. Unlisted is
 * link-sharing, not website-embedding.
 *
 * Every embed resolver in `apps/mana/apps/web/src/lib/modules/website/
 * embeds.ts` must call this before inlining records into the snapshot.
 */
export function canEmbedOnWebsite(level: VisibilityLevel): boolean {
	return level === 'public';
}

/**
 * Can this record be fetched via a direct unlisted-token link? Includes
 * `public` because a public record is reachable by link too (it just
 * also appears in embeds).
 */
export function isReachableByLink(level: VisibilityLevel): boolean {
	return level === 'public' || level === 'unlisted';
}

/**
 * Is this record visible to other members of the owner's space, under
 * the normal `spaceModulePermissions` matrix? All non-private levels
 * are. Private records are owner-only, even inside multi-member spaces.
 */
export function isVisibleToSpaceMember(level: VisibilityLevel): boolean {
	return level !== 'private';
}

/**
 * Placeholder for a future cross-user AI-agent feature (see
 * docs/plans/visibility-system.md §3). Always returns false in Phase 1
 * so no current AI code path accidentally leaks data. When we're ready
 * to let agents read public cross-user records, flip this per-module
 * with an explicit opt-in.
 */
export function canAiAccessCrossUser(_level: VisibilityLevel): boolean {
	return false;
}
