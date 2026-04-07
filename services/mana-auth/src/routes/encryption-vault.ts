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

		return c.json({
			masterKey: bytesToBase64(result.masterKey),
			formatVersion: result.formatVersion,
			kekId: result.kekId,
		});
	});

	// ─── GET /key ────────────────────────────────────────────
	// The hot path: every Phase 3 client calls this immediately after
	// login. Returns the unwrapped MK as base64 over HTTPS. The vault
	// service writes a `fetch` audit row on success, `failed_fetch` on
	// any error path.
	app.get('/key', async (c) => {
		const user = c.get('user');
		const ctx = readAuditContext(c);

		try {
			const result = await vaultService.getMasterKey(user.userId, ctx);
			return c.json({
				masterKey: bytesToBase64(result.masterKey),
				formatVersion: result.formatVersion,
				kekId: result.kekId,
			});
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
	// (Future: add a `requires2fa: true` flag and short-circuit here if
	// the JWT lacks a recent step-up claim.)
	app.post('/rotate', async (c) => {
		const user = c.get('user');
		const ctx = readAuditContext(c);

		const result = await vaultService.rotate(user.userId, ctx);
		return c.json({
			masterKey: bytesToBase64(result.masterKey),
			formatVersion: result.formatVersion,
			kekId: result.kekId,
		});
	});

	return app;
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
