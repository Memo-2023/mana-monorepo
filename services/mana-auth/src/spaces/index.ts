/**
 * Spaces — multi-tenancy helpers for mana-auth.
 *
 * The canonical SpaceType + allowlist lives in @mana/shared-types. This
 * barrel adds auth-side concerns: Better Auth hook helpers for validating
 * organization metadata, and (future) slug generation for personal spaces.
 *
 * See docs/plans/spaces-foundation.md.
 */

export {
	assertValidSpaceMetadataForCreate,
	assertSpaceIsDeletable,
	buildSpaceMetadata,
} from './metadata';
