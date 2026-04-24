/**
 * @mana/shared-privacy
 *
 * Unified visibility/privacy primitives for every Mana module. Provides:
 *
 *   - VisibilityLevel enum: 'private' | 'space' | 'unlisted' | 'public'
 *   - Zod schema for validation at the record/schema layer
 *   - Default helper (derives private vs space from the active space type)
 *   - Predicates for publish-time gating (canEmbedOnWebsite, …)
 *   - Unlisted-token generator (32-char base64url, CSPRNG)
 *   - <VisibilityPicker> Svelte component for the consistent UI control
 *
 * Design + rollout: docs/plans/visibility-system.md.
 *
 * Import path stays flat:
 *   import {
 *     VisibilityLevelSchema,
 *     canEmbedOnWebsite,
 *     VisibilityPicker,
 *   } from '@mana/shared-privacy';
 */

export type { VisibilityLevel, VisibilityMeta, VisibilityChangedPayload } from './types';
export { VISIBILITY_LEVELS, VISIBILITY_METADATA } from './types';
export { VisibilityLevelSchema, UnlistedTokenSchema } from './schema';
export { defaultVisibilityFor } from './defaults';
export {
	canEmbedOnWebsite,
	isReachableByLink,
	isVisibleToSpaceMember,
	canAiAccessCrossUser,
} from './predicates';
export { generateUnlistedToken } from './tokens';

export {
	publishUnlistedSnapshot,
	revokeUnlistedSnapshot,
	buildShareUrl,
	UnlistedApiError,
	type PublishUnlistedOptions,
	type PublishUnlistedResult,
	type RevokeUnlistedOptions,
} from './unlisted-client';

export { default as VisibilityPicker } from './VisibilityPicker.svelte';
export { default as SharedLinkControls } from './SharedLinkControls.svelte';
