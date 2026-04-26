/**
 * Singleton bootstrap endpoint.
 *
 * `POST /api/v1/me/bootstrap-singletons` — idempotently provisions the
 * per-user `userContext` singleton and the per-Space `kontextDoc` for
 * every Space the caller is a member of. Called once per webapp boot
 * as a reconciliation belt-and-suspenders for the signup-time hooks
 * (databaseHooks.user.create.after + organizationHooks.afterCreateOrganization).
 *
 * Why both: the signup hooks are zero-latency happy-path bootstraps but
 * fire-and-forget — a transient mana_sync outage during signup leaves
 * the user with no singleton and no signal that anything is wrong. The
 * boot-time endpoint converges to the right state on every load.
 * Idempotency in the bootstrap functions makes double-invocation
 * harmless.
 *
 * The endpoint is deliberately simple: no body, no parameters. The
 * caller's identity (and thus the userId + space-membership list)
 * comes from the JWT.
 */

import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { logger } from '@mana/shared-hono';
import type { AuthUser } from '../middleware/jwt-auth';
import type { Database } from '../db/connection';
import { members } from '../db/schema/organizations';
import {
	bootstrapUserSingletons,
	bootstrapSpaceSingletons,
} from '../services/bootstrap-singletons';

export interface BootstrapResponse {
	ok: true;
	bootstrapped: {
		userContext: boolean;
		spaces: Record<string, boolean>;
	};
}

export function createMeBootstrapRoutes(
	db: Database,
	syncDatabaseUrl: string
): Hono<{ Variables: { user: AuthUser } }> {
	// Lazy module-scoped postgres pool. Mirrors routes/auth.ts and
	// better-auth.config.ts — process lifetime owns it; never closed
	// manually.
	let _syncSql: ReturnType<typeof postgres> | null = null;
	const getSyncSql = (): ReturnType<typeof postgres> => {
		if (!_syncSql) _syncSql = postgres(syncDatabaseUrl, { max: 2 });
		return _syncSql;
	};

	return new Hono<{ Variables: { user: AuthUser } }>().post('/', async (c) => {
		const user = c.get('user');
		const syncSql = getSyncSql();

		const result: BootstrapResponse = {
			ok: true,
			bootstrapped: { userContext: false, spaces: {} },
		};

		try {
			result.bootstrapped.userContext = await bootstrapUserSingletons(user.userId, syncSql);
		} catch (err) {
			logger.error('[me/bootstrap-singletons] userContext failed', {
				userId: user.userId,
				err: err instanceof Error ? err.message : String(err),
			});
			return c.json({ ok: false, error: 'userContext bootstrap failed' }, 500);
		}

		// Bootstrap every Space the user is a member of. The owner of a
		// Space is the canonical writer for its singletons, but RLS
		// only gates by user_id (writer); the membership-aware pull
		// delivers the row to every member regardless of which member
		// inserted it. If the owner's bootstrap failed at signup time
		// and a non-owner member calls this endpoint first, the
		// member's bootstrap stands in.
		const memberRows = await db
			.select({ organizationId: members.organizationId })
			.from(members)
			.where(eq(members.userId, user.userId));

		for (const row of memberRows) {
			const spaceId = row.organizationId;
			try {
				result.bootstrapped.spaces[spaceId] = await bootstrapSpaceSingletons(
					spaceId,
					user.userId,
					syncSql
				);
			} catch (err) {
				logger.error('[me/bootstrap-singletons] space failed', {
					userId: user.userId,
					spaceId,
					err: err instanceof Error ? err.message : String(err),
				});
				// Don't abort — surface the per-space outcome and
				// continue. The caller can retry on next boot.
				result.bootstrapped.spaces[spaceId] = false;
			}
		}

		return c.json(result);
	});
}
