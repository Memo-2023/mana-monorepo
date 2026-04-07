/**
 * Encryption vault routes — `/api/v1/me/encryption-vault/*`
 *
 * The browser fetches its master key from these endpoints at login and
 * stashes the result in sessionStorage. All routes require a valid JWT
 * via the standard jwt-auth middleware — there is no admin or service-
 * to-service variant. The vault is a strictly per-user resource.
 *
 * Routes:
 *   POST /init       → Mints a fresh MK if none exists, then returns it.
 *                      Idempotent — calling twice is safe and returns
 *                      the existing key on the second call.
 *   GET  /key        → Returns the existing MK. 404 if not initialised
 *                      (client should call /init).
 *   POST /rotate     → Mints a new MK, replaces the existing wrap. Caller
 *                      MUST handle re-encryption of any data sealed with
 *                      the old key.
 *
 * The master key crosses the wire as base64 — never as raw bytes — so
 * a JSON-aware client (browser, curl, jq) can deserialise it without
 * worrying about binary content.
 *
 * Audit logging is the service's job; the route just passes ip + UA in
 * via AuditContext.
 */

import { Hono, type Context } from 'hono';
import type { AuthUser } from '../middleware/jwt-auth';
import {
	EncryptionVaultService,
	VaultNotFoundError,
	RecoveryWrapMissingError,
	ZeroKnowledgeActiveError,
	ZeroKnowledgeRotateForbidden,
	type AuditContext,
} from '../services/encryption-vault';

type AppContext = Context<{ Variables: { user: AuthUser } }>;

export function createEncryptionVaultRoutes(vaultService: EncryptionVaultService) {
	const app = new Hono<{ Variables: { user: AuthUser } }>();

	// ─── POST /init ──────────────────────────────────────────
	// Idempotent. First call creates a vault row; subsequent calls
	// return the existing master key. The client uses this on first
	// login per device — `init` is also a safe fallback if `/key`
	// returns 404 because the user has somehow never been initialised.
	app.post('/init', async (c) => {
		const user = c.get('user');
		const ctx = readAuditContext(c);

		const result = await vaultService.init(user.userId, ctx);
		return c.json(serializeFetchResult(result));
	});

	// ─── GET /key ────────────────────────────────────────────
	// The hot path: every Phase 3 client calls this immediately after
	// login. Returns either the unwrapped MK as base64 (standard mode)
	// OR the recovery-wrapped blob with `requiresRecoveryCode: true`
	// (zero-knowledge mode — Phase 9). The vault service writes a
	// `fetch` audit row on success, `failed_fetch` on any error path.
	app.get('/key', async (c) => {
		const user = c.get('user');
		const ctx = readAuditContext(c);

		try {
			const result = await vaultService.getMasterKey(user.userId, ctx);
			return c.json(serializeFetchResult(result));
		} catch (err) {
			if (err instanceof VaultNotFoundError) {
				return c.json({ error: 'vault not initialised', code: 'VAULT_NOT_INITIALISED' }, 404);
			}
			throw err; // 500 via global error handler + audit row already written
		}
	});

	// ─── POST /rotate ────────────────────────────────────────
	// Destructive. Mints a fresh MK and overwrites the wrap. The old MK
	// is gone forever. Routes do NOT enforce a 2FA challenge here —
	// that's a UX decision the front-end has to enforce before calling.
	// Forbidden in zero-knowledge mode (returns 409); the client has to
	// disable ZK first.
	app.post('/rotate', async (c) => {
		const user = c.get('user');
		const ctx = readAuditContext(c);

		try {
			const result = await vaultService.rotate(user.userId, ctx);
			return c.json(serializeFetchResult(result));
		} catch (err) {
			if (err instanceof ZeroKnowledgeRotateForbidden) {
				return c.json(
					{
						error: 'cannot rotate in zero-knowledge mode',
						code: 'ZK_ROTATE_FORBIDDEN',
					},
					409
				);
			}
			throw err;
		}
	});

	// ─── POST /recovery-wrap ─────────────────────────────────
	// Phase 9. Stores (or replaces) the user's recovery wrap. The
	// client wraps the master key with a recovery-derived key locally
	// and posts only the resulting ciphertext + IV. The recovery secret
	// itself NEVER touches the wire — that's the entire point of the
	// zero-knowledge design.
	//
	// This endpoint by itself does NOT enable zero-knowledge mode. The
	// client has to follow up with POST /zero-knowledge after the user
	// confirms they have backed up the recovery code.
	app.post('/recovery-wrap', async (c) => {
		const user = c.get('user');
		const ctx = readAuditContext(c);

		const body = await c.req.json().catch(() => null);
		if (
			!body ||
			typeof body.recoveryWrappedMk !== 'string' ||
			typeof body.recoveryIv !== 'string' ||
			!body.recoveryWrappedMk ||
			!body.recoveryIv
		) {
			return c.json(
				{
					error: 'recoveryWrappedMk and recoveryIv are required (base64 strings)',
					code: 'BAD_REQUEST',
				},
				400
			);
		}

		try {
			await vaultService.setRecoveryWrap(
				user.userId,
				{ recoveryWrappedMk: body.recoveryWrappedMk, recoveryIv: body.recoveryIv },
				ctx
			);
			return c.json({ ok: true });
		} catch (err) {
			if (err instanceof VaultNotFoundError) {
				return c.json({ error: 'vault not initialised', code: 'VAULT_NOT_INITIALISED' }, 404);
			}
			throw err;
		}
	});

	// ─── DELETE /recovery-wrap ───────────────────────────────
	// Removes the recovery wrap. Forbidden in zero-knowledge mode
	// (would lock the user out). Returns 409 with code ZK_ACTIVE in
	// that case.
	app.delete('/recovery-wrap', async (c) => {
		const user = c.get('user');
		const ctx = readAuditContext(c);

		try {
			await vaultService.clearRecoveryWrap(user.userId, ctx);
			return c.json({ ok: true });
		} catch (err) {
			if (err instanceof VaultNotFoundError) {
				return c.json({ error: 'vault not initialised', code: 'VAULT_NOT_INITIALISED' }, 404);
			}
			if (err instanceof ZeroKnowledgeActiveError) {
				return c.json(
					{
						error: 'cannot clear recovery wrap while zero-knowledge is active',
						code: 'ZK_ACTIVE',
					},
					409
				);
			}
			throw err;
		}
	});

	// ─── POST /zero-knowledge ────────────────────────────────
	// Toggles zero-knowledge mode. Body shape:
	//   { enable: true }                     → flip on (requires recovery wrap)
	//   { enable: false, masterKey: base64 } → flip off (re-wrap with KEK)
	//
	// Enabling is destructive: the server-side wrapped_mk is NULLed out
	// and the server can no longer decrypt the user's data. The client
	// MUST have already called POST /recovery-wrap before calling this
	// — otherwise the server returns 400 RECOVERY_WRAP_MISSING.
	//
	// Disabling requires the client to supply the freshly-unwrapped MK
	// (from the recovery code unwrap) so the server can re-wrap it
	// with the KEK. The user has to be unlocked at the moment of
	// disable.
	app.post('/zero-knowledge', async (c) => {
		const user = c.get('user');
		const ctx = readAuditContext(c);

		const body = (await c.req.json().catch(() => null)) as {
			enable?: boolean;
			masterKey?: string;
		} | null;

		if (!body || typeof body.enable !== 'boolean') {
			return c.json({ error: '`enable: boolean` is required', code: 'BAD_REQUEST' }, 400);
		}

		try {
			if (body.enable) {
				await vaultService.enableZeroKnowledge(user.userId, ctx);
				return c.json({ ok: true, zeroKnowledge: true });
			} else {
				if (typeof body.masterKey !== 'string' || !body.masterKey) {
					return c.json(
						{
							error: '`masterKey: base64` is required when disabling zero-knowledge',
							code: 'BAD_REQUEST',
						},
						400
					);
				}
				const mkBytes = base64ToBytes(body.masterKey);
				if (mkBytes.length !== 32) {
					return c.json({ error: 'masterKey must decode to 32 bytes', code: 'BAD_REQUEST' }, 400);
				}
				await vaultService.disableZeroKnowledge(user.userId, mkBytes, ctx);
				// Best-effort wipe of the bytes once we've handed them off.
				mkBytes.fill(0);
				return c.json({ ok: true, zeroKnowledge: false });
			}
		} catch (err) {
			if (err instanceof VaultNotFoundError) {
				return c.json({ error: 'vault not initialised', code: 'VAULT_NOT_INITIALISED' }, 404);
			}
			if (err instanceof RecoveryWrapMissingError) {
				return c.json(
					{
						error: 'set a recovery wrap before enabling zero-knowledge',
						code: 'RECOVERY_WRAP_MISSING',
					},
					400
				);
			}
			throw err;
		}
	});

	return app;
}

/** Maps the service's VaultFetchResult into the JSON response shape.
 *  Branches on `requiresRecoveryCode` so the route handler doesn't
 *  duplicate the field-juggling. */
function serializeFetchResult(result: {
	masterKey: Uint8Array | null;
	formatVersion: number;
	kekId: string;
	requiresRecoveryCode?: boolean;
	recoveryWrappedMk?: string;
	recoveryIv?: string;
}): Record<string, unknown> {
	if (result.requiresRecoveryCode) {
		return {
			requiresRecoveryCode: true,
			recoveryWrappedMk: result.recoveryWrappedMk,
			recoveryIv: result.recoveryIv,
			formatVersion: result.formatVersion,
		};
	}
	return {
		masterKey: bytesToBase64(result.masterKey!),
		formatVersion: result.formatVersion,
		kekId: result.kekId,
	};
}

// ─── Helpers ─────────────────────────────────────────────────

function readAuditContext(c: AppContext): AuditContext {
	return {
		ipAddress:
			c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
			c.req.header('x-real-ip') ||
			undefined,
		userAgent: c.req.header('user-agent') || undefined,
	};
}

function bytesToBase64(bytes: Uint8Array): string {
	let bin = '';
	for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
	return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array {
	const bin = atob(b64);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
	return out;
}
