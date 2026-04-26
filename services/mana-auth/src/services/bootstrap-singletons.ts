/**
 * Server-side singleton bootstrap.
 *
 * On first user-creation, write the per-user singleton records that the
 * webapp would otherwise create on demand via `ensureDoc()`. This makes
 * the bootstrap deterministic — every fresh client pulls the singleton
 * from mana-sync instead of racing on a local insert.
 *
 * Currently bootstrapped:
 *   - `userContext` — the structured profile + freeform markdown blob
 *     keyed by `id='singleton'`. Default shape mirrors the webapp's
 *     `emptyUserContext()` factory in `profile/types.ts`.
 *
 * Not bootstrapped here:
 *   - `kontextDoc` — per-Space, not per-user. Created on Space creation
 *     by the Spaces foundation; bootstrap there if needed in F4
 *     follow-up. The webapp's `ensureDoc()` for kontextDoc is still
 *     race-anfällig but doesn't surface the symptom F4 closes.
 *
 * Idempotency: `ON CONFLICT (...) DO NOTHING` on the sync_changes
 * primary key would only catch re-inserts of the same row id, which
 * never happens (UUIDs are fresh per call). Instead the caller MUST
 * gate on user-creation success — calling this twice for the same
 * user will produce two insert rows for the same singleton, and the
 * field-LWW replay on the client will collapse them into one record
 * with the latest field-meta winning. Harmless, but wasteful, so the
 * post-signUp hook in routes/auth.ts only fires it once per real
 * registration.
 */

import type postgres from 'postgres';

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
 * Insert the per-user singletons into mana_sync.sync_changes. Called
 * fire-and-forget from the post-signUp hook in routes/auth.ts; failures
 * are logged but do not abort registration (the webapp's `ensureDoc()`
 * is still in place as a fallback for the F4-F5 transition window).
 */
export async function bootstrapUserSingletons(
	userId: string,
	syncSql: ReturnType<typeof postgres>
): Promise<void> {
	if (!userId) throw new Error('bootstrapUserSingletons: empty userId');

	const now = new Date().toISOString();
	const data = emptyUserContextData(userId);

	// Per-field at stamp for every real data field. The receiving client
	// reads `field_meta` to populate `__fieldMeta[k] = { at, actor:
	// changeActor, origin: 'server-replay' }` — no conflicts, no toasts.
	const fieldMeta: Record<string, string> = {};
	for (const key of Object.keys(data)) {
		if (key === 'id') continue;
		fieldMeta[key] = now;
	}

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
