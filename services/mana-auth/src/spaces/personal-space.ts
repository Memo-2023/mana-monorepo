/**
 * Personal-Space auto-creation.
 *
 * Every user gets a Space of type `personal` at signup — their private
 * default context for modules like mood, dreams, sleep, etc. This module
 * implements the creation logic and the slug-collision handling it needs.
 *
 * Called from `databaseHooks.user.create.after` in better-auth.config.ts.
 * If creation fails (e.g. a DB error), the hook propagates the error and
 * the signup fails — orphan users without a personal space would be a
 * worse failure mode than a retry-able signup error.
 */

import { and, eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { isSpaceTier, type SpaceTier } from '@mana/shared-types';
import { organizations, members } from '../db/schema/organizations';
import type { Database } from '../db/connection';
import { buildSpaceMetadata } from './metadata';

/** Max suffix we try before giving up on collision resolution. */
const MAX_SLUG_SUFFIX = 999;

/** Slugs we never hand out — reserved for system routes or future use. */
const RESERVED_SLUGS = new Set([
	'me',
	'admin',
	'api',
	'auth',
	'login',
	'logout',
	'signup',
	'signin',
	'register',
	'settings',
	'new',
	'app',
	'www',
	'support',
	'help',
	'billing',
	'invite',
]);

/**
 * Turn an email local-part (or any free-form input) into a slug candidate.
 * Lowercase, alphanumerics + hyphens only, max 30 chars.
 */
export function candidateSlugFromEmail(email: string): string {
	const localPart = email.split('@', 1)[0] ?? '';
	const slug = localPart
		.toLowerCase()
		.replace(/[^a-z0-9-]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 30);
	// If stripping left nothing, fall back to a short random string so the
	// caller always gets a non-empty base to work from.
	return slug || `user-${nanoid(6).toLowerCase()}`;
}

/** Lookup function: returns true iff the given slug is already taken. */
export type SlugTakenLookup = (slug: string) => Promise<boolean>;

/**
 * Find a free slug by appending `-2`, `-3`, … if the base is taken or
 * reserved. Gives up after MAX_SLUG_SUFFIX attempts and falls back to a
 * random suffix — in practice collision at that scale means something's
 * wrong with the base generator, not real contention.
 *
 * Takes an injectable `isSlugTaken` function so unit tests don't need a
 * DB. Production code uses `dbSlugTaken(db)` (below) as the adapter.
 */
export async function resolveUniqueSlug(
	base: string,
	isSlugTaken: SlugTakenLookup
): Promise<string> {
	const isFree = async (slug: string): Promise<boolean> => {
		if (RESERVED_SLUGS.has(slug)) return false;
		return !(await isSlugTaken(slug));
	};

	if (await isFree(base)) return base;

	for (let i = 2; i <= MAX_SLUG_SUFFIX; i++) {
		const candidate = `${base}-${i}`;
		if (await isFree(candidate)) return candidate;
	}

	// Defensive fallback — should never be reached under realistic load.
	return `${base}-${nanoid(6).toLowerCase()}`;
}

/** Adapter: turns a Drizzle db into a SlugTakenLookup. */
export function dbSlugTaken(db: Database): SlugTakenLookup {
	return async (slug) => {
		const existing = await db
			.select({ id: organizations.id })
			.from(organizations)
			.where(eq(organizations.slug, slug))
			.limit(1);
		return existing.length > 0;
	};
}

/**
 * Create the personal space for a freshly-registered user.
 *
 * Idempotent: if the user already owns a space of type `personal`, returns
 * its id without creating a second one. Protects against accidental retry
 * in the auth signup flow.
 */
export async function createPersonalSpaceFor(
	db: Database,
	user: { id: string; email: string; name?: string | null; accessTier?: string | null }
): Promise<{ organizationId: string; slug: string; created: boolean }> {
	// Idempotency guard — check for existing personal space via member join.
	const existing = await db
		.select({ orgId: organizations.id, slug: organizations.slug, metadata: organizations.metadata })
		.from(organizations)
		.innerJoin(members, eq(members.organizationId, organizations.id))
		.where(eq(members.userId, user.id));

	for (const row of existing) {
		const meta = row.metadata as { type?: string } | null;
		if (meta?.type === 'personal') {
			return { organizationId: row.orgId, slug: row.slug ?? '', created: false };
		}
	}

	const base = candidateSlugFromEmail(user.email);
	const slug = await resolveUniqueSlug(base, dbSlugTaken(db));
	const orgId = nanoid();
	const memberId = nanoid();
	const displayName = user.name?.trim() || user.email.split('@', 1)[0] || 'Personal';

	// Carry the user's existing access tier onto the personal Space so
	// the user→space tier migration doesn't downgrade anyone. A founder
	// account setting up their first space stays at founder in that
	// space. Invalid or missing values default to 'public' — matches the
	// Better Auth user.accessTier default.
	const inheritedTier: SpaceTier = isSpaceTier(user.accessTier) ? user.accessTier : 'public';

	await db.transaction(async (tx) => {
		await tx.insert(organizations).values({
			id: orgId,
			name: displayName,
			slug,
			metadata: buildSpaceMetadata('personal', { tier: inheritedTier }),
			logo: null,
		});
		await tx.insert(members).values({
			id: memberId,
			organizationId: orgId,
			userId: user.id,
			role: 'owner',
		});
	});

	return { organizationId: orgId, slug, created: true };
}
