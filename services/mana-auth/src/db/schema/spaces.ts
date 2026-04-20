/**
 * Spaces — Postgres schema extensions for Better Auth organizations.
 *
 * The canonical SpaceType + SpaceMetadata contract lives in
 * `@mana/shared-types`; the organization itself lives in the `auth` schema
 * (see organizations.ts). This file adds the *server-side* extensions that
 * don't belong in the client-synced world:
 *
 *   - `spaces.credentials`         — per-space OAuth tokens + API keys
 *                                    (LinkedIn, Stripe, Twilio, SMTP, …).
 *                                    Must live server-side because we never
 *                                    want them in IndexedDB / Dexie.
 *   - `spaces.module_permissions`  — role × module × action matrix.
 *                                    Lets a club's trainer read `calendar`
 *                                    but not `club-finance`, for example.
 *
 * See docs/plans/spaces-foundation.md.
 */

import { pgSchema, text, timestamp, boolean, index, primaryKey } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

export const spacesSchema = pgSchema('spaces');

/**
 * Per-space external credentials.
 *
 * Tokens are encrypted at rest with the service-wide KEK (same mechanism
 * as auth.encryption_vaults). The `(space_id, provider)` composite key
 * means one token per provider per space — a second LinkedIn OAuth flow
 * for the same Edisconet space overwrites the first.
 *
 * No FK on `provider` — it's a free-form string (`linkedin`, `stripe`,
 * `twilio_sms`, `twitter`, …) so we can add integrations without schema
 * migrations. Service code handles the provider-specific payload.
 */
export const spaceCredentials = spacesSchema.table(
	'credentials',
	{
		spaceId: text('space_id')
			.references(() => organizations.id, { onDelete: 'cascade' })
			.notNull(),
		provider: text('provider').notNull(),
		accessTokenEncrypted: text('access_token_encrypted').notNull(),
		refreshTokenEncrypted: text('refresh_token_encrypted'),
		expiresAt: timestamp('expires_at', { withTimezone: true }),
		scopes: text('scopes').array(),
		providerAccountId: text('provider_account_id'),
		// Free-form per-provider metadata (org name, page id, webhook secret).
		// Kept as text JSON to avoid pulling the jsonb type in — callers
		// parse/serialize explicitly.
		metadataJson: text('metadata_json'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.spaceId, table.provider] }),
		spaceIdx: index('space_credentials_space_idx').on(table.spaceId),
	})
);

/**
 * Role × module permission matrix for a space.
 *
 * Example rows for a club:
 *   (org_123, 'owner',   'club-finance', true, true, true)
 *   (org_123, 'admin',   'club-finance', true, true, false)
 *   (org_123, 'trainer', 'club-finance', false, false, false)  -- explicit deny
 *   (org_123, 'trainer', 'calendar',     true,  true,  false)
 *
 * If no row exists for `(space, role, module)`, the fallback is the
 * default derived from the space type (see SPACE_MODULE_ALLOWLIST in
 * shared-types) + role tier (owner > admin > member). These rows only
 * exist when the space owner has customized the default.
 */
export const spaceModulePermissions = spacesSchema.table(
	'module_permissions',
	{
		spaceId: text('space_id')
			.references(() => organizations.id, { onDelete: 'cascade' })
			.notNull(),
		role: text('role').notNull(),
		moduleId: text('module_id').notNull(),
		canRead: boolean('can_read').notNull().default(true),
		canWrite: boolean('can_write').notNull().default(false),
		canAdmin: boolean('can_admin').notNull().default(false),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => ({
		pk: primaryKey({ columns: [table.spaceId, table.role, table.moduleId] }),
		spaceModuleIdx: index('space_module_permissions_space_module_idx').on(
			table.spaceId,
			table.moduleId
		),
	})
);
