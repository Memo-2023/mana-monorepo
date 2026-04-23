/**
 * Website module — DB schema (Drizzle / pgSchema 'website')
 *
 * Server-side store for **published snapshots only**. Editor data (sites,
 * pages, blocks) is local-first and lives in IndexedDB + the generic
 * mana-sync Postgres pool. We don't mirror it into a dedicated table —
 * the publish endpoint receives the assembled blob from the client.
 *
 * See docs/plans/website-builder.md §D5 (draft/published as two
 * snapshots) and §D6 (public-serving via SvelteKit-SSR).
 *
 * Storage model:
 *   - One row per publish event. `is_current=true` marks the row served
 *     to the public — there is always exactly one current row per slug
 *     (enforced by a partial unique index).
 *   - Older rows stay for rollback (M2). GC job in M7 deletes rows
 *     beyond a retention window (last 10 per site, say).
 *   - `slug` is denormalized from the site so public resolution is a
 *     single index lookup without JOIN.
 *   - No FK to a `sites` table because sites live in the sync store, not
 *     here. Orphaning is acceptable: if a user deletes their site, the
 *     client calls POST /sites/:id/unpublish to flip is_current off.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { pgSchema, uuid, text, timestamp, jsonb, boolean, index } from 'drizzle-orm/pg-core';
import { getConnection } from '../../lib/db';

export const websiteSchema = pgSchema('website');

/**
 * One row per publish. Content is a fully-resolved JSON blob that the
 * public renderer serves verbatim (no JOINs, no downstream queries).
 */
export const publishedSnapshots = websiteSchema.table(
	'published_snapshots',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		/** Site id from the client. Untethered UUID (no FK). */
		siteId: uuid('site_id').notNull(),
		/** Denormalized from site.slug at publish time. Unique per is_current. */
		slug: text('slug').notNull(),
		/** Full resolved snapshot — shape mirrors PublishedSnapshot in publish.ts. */
		blob: jsonb('blob').notNull(),
		/** True for the row served to the public. Exactly one per slug. */
		isCurrent: boolean('is_current').notNull().default(false),
		publishedAt: timestamp('published_at', { withTimezone: true }).defaultNow().notNull(),
		/** User who pressed the publish button. */
		publishedBy: uuid('published_by').notNull(),
		/**
		 * Space the site belongs to. Nullable in M2 because mana-auth
		 * doesn't yet thread the active space into JWT claims — the
		 * client can pass it via `X-Mana-Space`, but we don't hard-require
		 * it until server-side membership check lands (M6).
		 */
		spaceId: uuid('space_id'),
	},
	(table) => [
		index('published_snapshots_site_idx').on(table.siteId, table.publishedAt),
		index('published_snapshots_slug_current_idx').on(table.slug, table.isCurrent),
	]
);

export const db = drizzle(getConnection(), {
	schema: { publishedSnapshots },
});

export type PublishedSnapshotRow = typeof publishedSnapshots.$inferSelect;
export type NewPublishedSnapshot = typeof publishedSnapshots.$inferInsert;
