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

/**
 * Form submissions inbox. Every POST to /public/submit/:siteId/:blockId
 * lands here. `payload` is nulled after successful delivery to the
 * target module (M4.x); M4 first-pass keeps it indefinitely so the
 * owner sees it in the submissions UI.
 */
export const submissions = websiteSchema.table(
	'submissions',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		siteId: uuid('site_id').notNull(),
		/** No FK — blocks live in Dexie + the sync pool, not here. */
		blockId: uuid('block_id').notNull(),
		/** JSON object — keys match the block's declared field names. */
		payload: jsonb('payload').notNull(),
		/** Denormalized at submit time so target routing survives block edits. */
		targetModule: text('target_module').notNull(),
		/** `'inbox'` in M4; expand when we wire contacts/notify handlers. */
		targetAction: text('target_action').notNull(),
		/** FK into the target module's record once delivered (M4.x). */
		targetRecordId: uuid('target_record_id'),
		/** 'received' | 'delivered' | 'failed'. */
		status: text('status').notNull(),
		errorMessage: text('error_message'),
		ip: text('ip'),
		userAgent: text('user_agent'),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [index('submissions_site_created_idx').on(table.siteId, table.createdAt)]
);

/**
 * Custom-domain bindings for founder-tier sites. One row per
 * (site, hostname). `status` walks the DNS-verify lifecycle:
 *
 *   pending   — user added the domain, no DNS check run yet
 *   verifying — DNS check in flight or retrying
 *   verified  — both the TXT challenge + CNAME resolve as expected
 *   failed    — the last check failed; user needs to fix DNS
 *
 * The public resolver reads hostname → site_id for VERIFIED rows only
 * so an unfinished verification can't serve someone else's site.
 *
 * See docs/plans/website-builder.md §M6.
 */
export const customDomains = websiteSchema.table(
	'custom_domains',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		siteId: uuid('site_id').notNull(),
		hostname: text('hostname').notNull().unique(),
		status: text('status').notNull().default('pending'),
		/** Expected TXT record contents — random token issued at create time. */
		verificationToken: text('verification_token').notNull(),
		/** Current CNAME target the user must point their hostname to. */
		dnsTarget: text('dns_target').notNull().default('custom.mana.how'),
		errorMessage: text('error_message'),
		verifiedAt: timestamp('verified_at', { withTimezone: true }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
		createdBy: uuid('created_by').notNull(),
	},
	(table) => [index('custom_domains_site_idx').on(table.siteId, table.status)]
	// A partial unique index on (hostname) WHERE status='verified' lives
	// in the SQL migration — drizzle-orm's `.where(sql...)` is awkward
	// for partial-index predicates and this index is rarely regenerated.
);

export const db = drizzle(getConnection(), {
	schema: { publishedSnapshots, submissions, customDomains },
});

export type PublishedSnapshotRow = typeof publishedSnapshots.$inferSelect;
export type NewPublishedSnapshot = typeof publishedSnapshots.$inferInsert;
export type SubmissionRow = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
export type CustomDomainRow = typeof customDomains.$inferSelect;
export type NewCustomDomain = typeof customDomains.$inferInsert;
