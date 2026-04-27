/**
 * Read-only cross-schema view of auth.users for the public-community
 * hub. mana-auth owns the table; we JOIN it from mana-analytics to
 * enrich feed responses with the post-author's real-name opt-in and
 * karma score. We never INSERT/UPDATE/DELETE here — that's
 * mana-auth's job.
 *
 * The full auth.users schema is defined in
 * services/mana-auth/src/db/schema/auth.ts; this file declares just
 * the columns mana-analytics actually reads.
 */

import { pgSchema, text, boolean, integer } from 'drizzle-orm/pg-core';

const authSchema = pgSchema('auth');

export const authUsers = authSchema.table('users', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	communityShowRealName: boolean('community_show_real_name').default(false).notNull(),
	communityKarma: integer('community_karma').default(0).notNull(),
});
