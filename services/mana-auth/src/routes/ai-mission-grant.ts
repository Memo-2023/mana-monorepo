/**
 * Mission Grant route — `POST /api/v1/me/ai-mission-grant`.
 *
 * Mints a grant that lets the mana-ai background runner decrypt the
 * allowlisted records for a specific mission without needing the user's
 * browser to be open. See `docs/plans/ai-mission-key-grant.md` for the
 * full flow; crypto details in `services/encryption-vault/mission-grant.ts`.
 *
 * The client posts `{ missionId, tables, recordIds, ttlMs? }`; the server
 * derives + RSA-wraps a Mission Data Key and returns the grant blob.
 * The webapp attaches this to `Mission.grant` via the normal sync path.
 * The recovery / revocation side lives on the webapp — revoking is just
 * setting `Mission.grant = null` on the Dexie record; the server has
 * nothing to remember.
 */

import { Hono, type Context } from 'hono';
import type { AuthUser } from '../middleware/jwt-auth';
import {
	MissionGrantService,
	MissionGrantNotConfigured,
	ZeroKnowledgeGrantForbidden,
	VaultNotFoundError,
} from '../services/encryption-vault/mission-grant';
import type { AuditContext } from '../services/encryption-vault';

type AppContext = Context<{ Variables: { user: AuthUser } }>;

export function createAiMissionGrantRoutes(service: MissionGrantService) {
	const app = new Hono<{ Variables: { user: AuthUser } }>();

	app.post('/', async (c) => {
		const user = c.get('user');
		const ctx = readAuditContext(c);

		const body = (await c.req.json().catch(() => null)) as {
			missionId?: unknown;
			tables?: unknown;
			recordIds?: unknown;
			ttlMs?: unknown;
		} | null;

		if (
			!body ||
			typeof body.missionId !== 'string' ||
			!body.missionId ||
			!Array.isArray(body.tables) ||
			!body.tables.every((t) => typeof t === 'string') ||
			!Array.isArray(body.recordIds) ||
			!body.recordIds.every((r) => typeof r === 'string')
		) {
			return c.json(
				{
					error: 'missionId (string), tables (string[]), recordIds (string[]) are required',
					code: 'BAD_REQUEST',
				},
				400
			);
		}
		const ttlMs = typeof body.ttlMs === 'number' ? body.ttlMs : undefined;

		try {
			const grant = await service.createGrant(
				user.userId,
				{
					missionId: body.missionId,
					tables: body.tables as string[],
					recordIds: body.recordIds as string[],
					ttlMs,
				},
				ctx
			);
			return c.json(grant);
		} catch (err) {
			if (err instanceof MissionGrantNotConfigured) {
				return c.json(
					{
						error: 'mission grants are not configured on this server',
						code: 'GRANT_NOT_CONFIGURED',
					},
					503
				);
			}
			if (err instanceof ZeroKnowledgeGrantForbidden) {
				return c.json(
					{
						error:
							'mission grants are unavailable in zero-knowledge mode — disable ZK or use the foreground runner',
						code: 'ZK_ACTIVE',
					},
					409
				);
			}
			if (err instanceof VaultNotFoundError) {
				return c.json({ error: 'vault not initialised', code: 'VAULT_NOT_INITIALISED' }, 404);
			}
			if (err instanceof Error && /required|must/.test(err.message)) {
				return c.json({ error: err.message, code: 'BAD_REQUEST' }, 400);
			}
			throw err;
		}
	});

	return app;
}

function readAuditContext(c: AppContext): AuditContext {
	return {
		ipAddress:
			c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
			c.req.header('x-real-ip') ||
			undefined,
		userAgent: c.req.header('user-agent') || undefined,
	};
}
