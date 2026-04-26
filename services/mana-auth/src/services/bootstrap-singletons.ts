/**
 * Server-side singleton bootstrap.
 *
 * On first user-creation and Space-creation, write the singleton records
 * that the webapp would otherwise create on demand via `ensureDoc()` /
 * `getOrCreateLocalDoc()`. This makes the bootstrap deterministic — every
 * fresh client pulls the singleton from mana-sync instead of racing on a
 * local insert that the next pull would clobber.
 *
 * Currently bootstrapped:
 *   - `userContext` — per-user. The structured profile + freeform markdown
 *     blob keyed by `id='singleton'`. Default shape mirrors the webapp's
 *     `emptyUserContext()` factory in `profile/types.ts`.
 *   - `kontextDoc` — per-Space. The freeform markdown context document
 *     (encrypted at rest in normal client writes; bootstrap writes the
 *     empty default in plaintext, the client's `decryptRecord` skips
 *     non-envelope strings so this is safe).
 *
 * Idempotency: `ON CONFLICT (...) DO NOTHING` on the sync_changes primary
 * key would only catch re-inserts of the same row id, which never happens
 * (UUIDs are fresh per call). Instead the caller MUST gate on the first
 * real creation event — the user-create hook fires once per real signup,
 * and the personal-space + organization hooks fire once per real Space
 * creation. Calling either bootstrap twice for the same target produces
 * two insert rows; field-LWW replay collapses them on the client (latest
 * `at` wins). Harmless but wasteful, hence the `created: true` gate in
 * `createPersonalSpaceFor`'s caller.
 */

import postgres from 'postgres';

interface Actor {
	kind: 'system';
	principalId: string;
	displayName: string;
}

const BOOTSTRAP_ACTOR: Actor = {
	kind: 'system',
	principalId: 'system:bootstrap',
	displayName: 'Bootstrap',
};

const BOOTSTRAP_CLIENT_ID = 'system:bootstrap';
const BOOTSTRAP_ORIGIN = 'system';

/**
 * Build a `field_meta` object for the bootstrap insert: every key in
 * `data` (except `id`) gets the same `at` timestamp. The receiving client
 * reads this column and populates `__fieldMeta[k] = { at, actor:
 * changeActor, origin: 'server-replay' }` — never surfaces as a conflict.
 */
function buildFieldMeta(data: Record<string, unknown>, at: string): Record<string, string> {
	const meta: Record<string, string> = {};
	for (const key of Object.keys(data)) {
		if (key === 'id') continue;
		meta[key] = at;
	}
	return meta;
}

/**
 * Default content for a new user's `userContext` singleton. Keep in sync
 * with `apps/mana/apps/web/src/lib/modules/profile/types.ts:emptyUserContext()`.
 * If the shape ever drifts, the receiving client will merge whatever
 * fields the server emits via field-LWW — extra fields stay at their
 * default (`undefined` → no override), missing fields default to the
 * client's local TypeScript shape on read.
 */
function emptyUserContextData(userId: string): Record<string, unknown> {
	return {
		id: 'singleton',
		about: {},
		interests: [],
		routine: {},
		nutrition: {},
		leisure: {},
		goals: [],
		social: {},
		freeform: '',
		interview: { answeredIds: [], skippedIds: [] },
		userId,
	};
}

/**
 * Default content for a new Space's `kontextDoc`. Just an id + empty
 * content — the user fills in the markdown later. Encryption is skipped
 * (empty string reveals nothing); the client's `decryptRecord` is
 * tolerant of plaintext values for encrypted-registry fields.
 */
function emptyKontextDocData(): Record<string, unknown> {
	return {
		id: crypto.randomUUID(),
		content: '',
	};
}

/**
 * Insert the per-user singletons into mana_sync.sync_changes. Called
 * fire-and-forget from the post-signUp hook in routes/auth.ts; failures
 * are logged but do not abort registration (the webapp's
 * `getOrCreateLocalDoc()` is still in place as a fallback for the rare
 * race where the first pull hasn't landed yet).
 */
export async function bootstrapUserSingletons(
	userId: string,
	syncSql: ReturnType<typeof postgres>
): Promise<void> {
	if (!userId) throw new Error('bootstrapUserSingletons: empty userId');

	const now = new Date().toISOString();
	const data = emptyUserContextData(userId);
	const fieldMeta = buildFieldMeta(data, now);

	await syncSql`
		INSERT INTO sync_changes (
			app_id, table_name, record_id, user_id, space_id, op, data,
			field_meta, client_id, schema_version, actor, origin
		)
		VALUES (
			'profile', 'userContext', 'singleton', ${userId}, NULL, 'insert',
			${syncSql.json(data as never)},
			${syncSql.json(fieldMeta as never)},
			${BOOTSTRAP_CLIENT_ID}, 1,
			${syncSql.json(BOOTSTRAP_ACTOR as never)},
			${BOOTSTRAP_ORIGIN}
		)
	`;
}

/**
 * Insert the per-Space singletons into mana_sync.sync_changes. Called
 * after every real Space creation:
 *   - Personal Space — from `databaseHooks.user.create.after` once
 *     `createPersonalSpaceFor` returns `created: true`.
 *   - Brand / club / family / team / practice — from
 *     `organizationHooks.afterCreateOrganization` on the org plugin.
 *
 * `ownerUserId` is the writer (RLS guard); `spaceId` is the data scope.
 * For non-personal Spaces the inviting user remains the writer — joining
 * members will receive the row via the membership-aware pull.
 */
export async function bootstrapSpaceSingletons(
	spaceId: string,
	ownerUserId: string,
	syncSql: ReturnType<typeof postgres>
): Promise<void> {
	if (!spaceId) throw new Error('bootstrapSpaceSingletons: empty spaceId');
	if (!ownerUserId) throw new Error('bootstrapSpaceSingletons: empty ownerUserId');

	const now = new Date().toISOString();
	const data = emptyKontextDocData();
	const fieldMeta = buildFieldMeta(data, now);

	await syncSql`
		INSERT INTO sync_changes (
			app_id, table_name, record_id, user_id, space_id, op, data,
			field_meta, client_id, schema_version, actor, origin
		)
		VALUES (
			'kontext', 'kontextDoc', ${data.id as string}, ${ownerUserId}, ${spaceId}, 'insert',
			${syncSql.json(data as never)},
			${syncSql.json(fieldMeta as never)},
			${BOOTSTRAP_CLIENT_ID}, 1,
			${syncSql.json(BOOTSTRAP_ACTOR as never)},
			${BOOTSTRAP_ORIGIN}
		)
	`;
}
