/**
 * EncryptionVaultService — server-side master key custody.
 *
 * Responsibilities:
 *   - init(userId): mint a fresh per-user master key, wrap it with the
 *     KEK, and store it. Idempotent: returns the existing vault if one
 *     already exists for this user.
 *   - getMasterKey(userId): unwrap the stored MK and return the raw 32
 *     bytes ready for HTTPS transit to the browser.
 *   - rotate(userId): mint a fresh MK, replace the existing wrap. The
 *     old MK is GONE — the caller must ensure all encrypted data is
 *     re-encrypted (or accepted as lost) before invoking rotate.
 *
 * All reads and writes go through `withUserScope(userId, fn)` so the
 * row-level-security policy on `auth.encryption_vaults` and
 * `auth.encryption_vault_audit` is satisfied. The transaction sets
 * `app.current_user_id` via `set_config(..., true)` (LOCAL scope) so
 * even if a future bug forgets the WHERE clause, the database refuses
 * to expose another user's vault entry.
 *
 * The audit table records every action — successful and failed — with
 * IP, user-agent, and HTTP status. Routes pass these in via the
 * AuditContext shape.
 */

import { eq, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import type { Database } from '../../db/connection';
import {
	encryptionVaults,
	encryptionVaultAudit,
	type EncryptionVault,
} from '../../db/schema/encryption-vaults';
import { wrapMasterKey, unwrapMasterKey, generateMasterKey, activeKekId } from './kek';

/** Per-request metadata used for audit log entries. */
export interface AuditContext {
	ipAddress?: string;
	userAgent?: string;
}

export interface VaultFetchResult {
	/** Raw 32 bytes of the unwrapped master key. Caller must base64-encode
	 *  before placing in the JSON response body. */
	masterKey: Uint8Array;
	/** Format version of the wrap currently in storage — bumps if we ever
	 *  migrate the wire format. The client doesn't usually care, but the
	 *  rotate flow uses it to know whether a re-wrap is needed. */
	formatVersion: number;
	/** Which KEK produced the wrapped value. */
	kekId: string;
}

export class EncryptionVaultService {
	constructor(private db: Database) {}

	// ─── Public API ──────────────────────────────────────────

	/**
	 * Idempotent vault initialisation. Returns the existing vault row if
	 * one already exists for this user, otherwise mints a fresh master
	 * key, wraps it with the KEK, and inserts.
	 *
	 * Returns the unwrapped master key bytes either way so the client
	 * can stash them immediately after the call.
	 */
	async init(userId: string, ctx: AuditContext = {}): Promise<VaultFetchResult> {
		return this.withUserScope(userId, async (tx) => {
			const existing = await tx
				.select()
				.from(encryptionVaults)
				.where(eq(encryptionVaults.userId, userId))
				.limit(1);

			if (existing.length > 0) {
				// Already initialised — fall through to a regular fetch.
				const masterKey = await unwrapMasterKey(existing[0].wrappedMk, existing[0].wrapIv);
				await this.writeAudit(tx, userId, 'init', ctx, 200, 'already-exists');
				return {
					masterKey,
					formatVersion: existing[0].formatVersion,
					kekId: existing[0].kekId,
				};
			}

			const mkBytes = generateMasterKey();
			const { wrappedMk, wrapIv } = await wrapMasterKey(mkBytes);

			await tx.insert(encryptionVaults).values({
				userId,
				wrappedMk,
				wrapIv,
				formatVersion: 1,
				kekId: activeKekId(),
			});

			await this.writeAudit(tx, userId, 'init', ctx, 201, 'created');

			return { masterKey: mkBytes, formatVersion: 1, kekId: activeKekId() };
		});
	}

	/**
	 * Fetches the current master key for a user. Throws if no vault has
	 * been initialised yet — the route handler converts that to a 404 so
	 * the client can call init() to bootstrap.
	 */
	async getMasterKey(userId: string, ctx: AuditContext = {}): Promise<VaultFetchResult> {
		return this.withUserScope(userId, async (tx) => {
			const rows = await tx
				.select()
				.from(encryptionVaults)
				.where(eq(encryptionVaults.userId, userId))
				.limit(1);

			if (rows.length === 0) {
				await this.writeAudit(tx, userId, 'failed_fetch', ctx, 404, 'not-initialised');
				throw new VaultNotFoundError(userId);
			}

			const row = rows[0];
			let masterKey: Uint8Array;
			try {
				masterKey = await unwrapMasterKey(row.wrappedMk, row.wrapIv);
			} catch (err) {
				// Auth-tag mismatch, wrong KEK, malformed row — all the same
				// to the caller (500), but we want a clear audit trail.
				await this.writeAudit(
					tx,
					userId,
					'failed_fetch',
					ctx,
					500,
					`unwrap-failed: ${(err as Error).message}`
				);
				throw err;
			}

			await this.writeAudit(tx, userId, 'fetch', ctx, 200, null);
			return { masterKey, formatVersion: row.formatVersion, kekId: row.kekId };
		});
	}

	/**
	 * Rotates a user's master key. The old MK is permanently lost — the
	 * caller is responsible for re-encrypting any data that was sealed
	 * with it BEFORE calling this method, or accepting the loss.
	 *
	 * Use cases:
	 *   - Suspected device compromise → rotate + force logout all
	 *     sessions + tell user "your old data needs re-syncing"
	 *   - Periodic best-practice rotation (rare in this design — the
	 *     KEK can rotate without touching the MK)
	 */
	async rotate(userId: string, ctx: AuditContext = {}): Promise<VaultFetchResult> {
		return this.withUserScope(userId, async (tx) => {
			const mkBytes = generateMasterKey();
			const { wrappedMk, wrapIv } = await wrapMasterKey(mkBytes);

			const updated = await tx
				.update(encryptionVaults)
				.set({
					wrappedMk,
					wrapIv,
					kekId: activeKekId(),
					rotatedAt: new Date(),
				})
				.where(eq(encryptionVaults.userId, userId))
				.returning();

			if (updated.length === 0) {
				// No existing vault — treat rotate as init.
				await tx.insert(encryptionVaults).values({
					userId,
					wrappedMk,
					wrapIv,
					formatVersion: 1,
					kekId: activeKekId(),
				});
				await this.writeAudit(tx, userId, 'rotate', ctx, 201, 'init-on-rotate');
			} else {
				await this.writeAudit(tx, userId, 'rotate', ctx, 200, null);
			}

			return { masterKey: mkBytes, formatVersion: 1, kekId: activeKekId() };
		});
	}

	// ─── Internals ───────────────────────────────────────────

	/**
	 * Wraps `fn` in a transaction with `app.current_user_id` set to the
	 * given userId via `set_config(..., true)`. RLS policies on
	 * encryption_vaults and encryption_vault_audit then admit only rows
	 * matching that userId — defense in depth on top of the explicit
	 * WHERE clauses.
	 *
	 * `set_config(name, value, true)` is the parameterised equivalent of
	 * `SET LOCAL` (which can't take bind parameters). The `true` flag
	 * scopes the setting to the current transaction.
	 */
	private async withUserScope<T>(
		userId: string,
		fn: (tx: Parameters<Parameters<Database['transaction']>[0]>[0]) => Promise<T>
	): Promise<T> {
		if (!userId) {
			throw new Error('mana-auth/vault: userId is required for vault operations');
		}
		return this.db.transaction(async (tx) => {
			await tx.execute(sql`SELECT set_config('app.current_user_id', ${userId}, true)`);
			return fn(tx);
		});
	}

	private async writeAudit(
		tx: Parameters<Parameters<Database['transaction']>[0]>[0],
		userId: string,
		action: 'init' | 'fetch' | 'rotate' | 'failed_fetch',
		ctx: AuditContext,
		status: number,
		context: string | null
	): Promise<void> {
		await tx.insert(encryptionVaultAudit).values({
			id: nanoid(),
			userId,
			action,
			ipAddress: ctx.ipAddress ?? null,
			userAgent: ctx.userAgent ?? null,
			context,
			status,
		});
	}
}

/**
 * Thrown when a fetch is attempted against a user who hasn't called
 * init() yet. Routes catch this specifically to convert it to a 404
 * (so the client can react with init() instead of treating it as a
 * server error).
 */
export class VaultNotFoundError extends Error {
	constructor(public userId: string) {
		super(`encryption vault not initialised for user ${userId}`);
		this.name = 'VaultNotFoundError';
	}
}

/** Re-export the type for route handlers. */
export type { EncryptionVault };
