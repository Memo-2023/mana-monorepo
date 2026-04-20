/**
 * Space metadata validation for Better Auth organization hooks.
 *
 * Every Better Auth organization in Mana must carry a `metadata.type` field
 * that identifies the Space type (personal/brand/club/family/team/practice).
 * This module enforces that contract at the plugin-hook layer.
 *
 * See docs/plans/spaces-foundation.md.
 */

import { APIError } from 'better-auth/api';
import {
	SPACE_TYPES,
	isSpaceType,
	parseSpaceMetadata,
	type SpaceMetadata,
	type SpaceType,
} from '@mana/shared-types';

/**
 * Validate the metadata blob that will be persisted for a new organization.
 * Throws a Better Auth `APIError` (BAD_REQUEST) if the shape is invalid.
 *
 * Intended for `organizationHooks.beforeCreateOrganization`.
 */
export function assertValidSpaceMetadataForCreate(raw: unknown): SpaceMetadata {
	const parsed = parseSpaceMetadata(raw);
	if (!parsed) {
		throw new APIError('BAD_REQUEST', {
			message: `Organization metadata must include a valid "type" field. Expected one of: ${SPACE_TYPES.join(', ')}.`,
			code: 'SPACE_METADATA_INVALID',
		});
	}
	return parsed;
}

/**
 * Guard a delete call against removing the user's personal space.
 * Better Auth will still allow admins/owners to delete other spaces — we only
 * protect the auto-created personal one, because losing it would orphan all
 * the user's private data.
 *
 * Intended for `organizationHooks.beforeDeleteOrganization`.
 */
export function assertSpaceIsDeletable(metadata: unknown): void {
	const parsed = parseSpaceMetadata(metadata);
	if (parsed?.type === 'personal') {
		throw new APIError('FORBIDDEN', {
			message: 'The personal space cannot be deleted. Delete the user account instead.',
			code: 'SPACE_PERSONAL_UNDELETABLE',
		});
	}
}

/**
 * Build a metadata blob for a freshly-created space of a given type. Used by
 * the signup-time personal-space auto-creator and by any future UI that
 * creates spaces of other types.
 */
export function buildSpaceMetadata(
	type: SpaceType,
	extra: Omit<SpaceMetadata, 'type'> = {}
): SpaceMetadata {
	if (!isSpaceType(type)) {
		throw new Error(`Invalid SpaceType: ${String(type)}`);
	}
	return { ...extra, type };
}
