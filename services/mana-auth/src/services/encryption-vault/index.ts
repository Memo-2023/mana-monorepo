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
	 *  before placing in the JSON response body.
	 *
	 *  null in zero-knowledge mode — the server cannot unwrap the MK
	 *  itself and must return the recovery-wrapped blob instead. The
	 *  route handler reads `requiresRecoveryCode` to know which branch
	 *  to send to the client. */
	masterKey: Uint8Array | null;
	/** Format version of the wrap currently in storage — bumps if we ever
	 *  migrate the wire format. The client doesn't usually care, but the
	 *  rotate flow uses it to know whether a re-wrap is needed. */
	formatVersion: number;
	/** Which KEK produced the wrapped value. Empty string in zero-knowledge
	 *  mode (no KEK wrap exists). */
	kekId: string;
	/** True if the vault is in zero-knowledge mode and the client must
	 *  provide a recovery code to unwrap. When set, masterKey is null
	 *  and the recovery* fields are populated instead. */
	requiresRecoveryCode?: boolean;
	/** Recovery wrap ciphertext (only set when requiresRecoveryCode). */
	recoveryWrappedMk?: string;
	/** Recovery wrap IV (only set when requiresRecoveryCode). */
	recoveryIv?: string;
}

/** Input for setting (or replacing) the recovery wrap. The client wraps
 *  the master key locally with a key derived from the recovery secret
 *  and sends only the resulting ciphertext + IV. The recovery secret
 *  itself NEVER touches the wire. */
export interface RecoveryWrapInput {
	recoveryWrappedMk: string;
	recoveryIv: string;
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
				// Already initialised. If the user is in zero-knowledge mode,
				// the server can no longer hand out the plaintext master key
				// — the route handler will return the recovery blob instead.
				const row = existing[0];
				if (row.zeroKnowledge) {
					await this.writeAudit(tx, userId, 'init', ctx, 200, 'already-exists-zk');
					return {
						masterKey: null,
						formatVersion: row.recoveryFormatVersion,
						kekId: '',
						requiresRecoveryCode: true,
						recoveryWrappedMk: row.recoveryWrappedMk!,
						recoveryIv: row.recoveryIv!,
					};
				}

				const masterKey = await unwrapMasterKey(row.wrappedMk!, row.wrapIv!);
				await this.writeAudit(tx, userId, 'init', ctx, 200, 'already-exists');
				return {
					masterKey,
					formatVersion: row.formatVersion,
					kekId: row.kekId,
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

			// Zero-knowledge fork: the server CANNOT decrypt the MK and
			// must return the recovery blob for the client to unwrap.
			// `requiresRecoveryCode` flips the route handler's response
			// shape — it sends the recovery wrap instead of a base64 MK.
			if (row.zeroKnowledge) {
				await this.writeAudit(tx, userId, 'fetch', ctx, 200, 'zk-recovery-blob');
				return {
					masterKey: null,
					formatVersion: row.recoveryFormatVersion,
					kekId: '',
					requiresRecoveryCode: true,
					recoveryWrappedMk: row.recoveryWrappedMk!,
					recoveryIv: row.recoveryIv!,
				};
			}

			let masterKey: Uint8Array;
			try {
				masterKey = await unwrapMasterKey(row.wrappedMk!, row.wrapIv!);
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
			// Rotate is forbidden in zero-knowledge mode — the server can't
			// re-wrap a key it can't read. The client has to disable
			// zero-knowledge first (which restores a server-side wrap),
			// then call rotate, then re-enable if desired.
			const existing = await tx
				.select()
				.from(encryptionVaults)
				.where(eq(encryptionVaults.userId, userId))
				.limit(1);
			if (existing.length > 0 && existing[0].zeroKnowledge) {
				await this.writeAudit(tx, userId, 'rotate', ctx, 409, 'zk-rotate-forbidden');
				throw new ZeroKnowledgeRotateForbidden(userId);
			}

			const mkBytes = generateMasterKey();
			const { wrappedMk, wrapIv } = await wrapMasterKey(mkBytes);

			const updated = await tx
				.update(encryptionVaults)
				.set({
					wrappedMk,
					wrapIv,
					kekId: activeKekId(),
					rotatedAt: new Date(),
					// Rotation also wipes any existing recovery wrap — the
					// new MK has nothing to do with the old one, so the old
					// recovery code would unwrap into garbage. The user has
					// to set up a fresh recovery code after rotating.
					recoveryWrappedMk: null,
					recoveryIv: null,
					recoverySetAt: null,
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

	// ─── Phase 9: Recovery Wrap + Zero-Knowledge ─────────────

	/**
	 * Stores (or replaces) the user's recovery wrap. The client builds
	 * the wrap locally — derives a key from the recovery secret, AES-GCM
	 * encrypts the master key, sends only the resulting ciphertext + IV.
	 * The recovery secret itself NEVER touches the wire.
	 *
	 * Storing a recovery wrap does NOT enable zero-knowledge mode by
	 * itself — the user has to follow up with `enableZeroKnowledge` to
	 * actually delete the server-side wrap. This two-step setup gives
	 * the UI room to confirm the recovery code is backed up before
	 * making the rotation irreversible.
	 *
	 * Idempotent: calling twice replaces the previous recovery wrap.
	 * Use case: user re-prints the recovery code with a fresh secret.
	 */
	async setRecoveryWrap(
		userId: string,
		input: RecoveryWrapInput,
		ctx: AuditContext = {}
	): Promise<void> {
		return this.withUserScope(userId, async (tx) => {
			const updated = await tx
				.update(encryptionVaults)
				.set({
					recoveryWrappedMk: input.recoveryWrappedMk,
					recoveryIv: input.recoveryIv,
					recoveryFormatVersion: 1,
					recoverySetAt: new Date(),
				})
				.where(eq(encryptionVaults.userId, userId))
				.returning();

			if (updated.length === 0) {
				await this.writeAudit(tx, userId, 'recovery_set', ctx, 404, 'no-vault');
				throw new VaultNotFoundError(userId);
			}

			await this.writeAudit(tx, userId, 'recovery_set', ctx, 200, null);
		});
	}

	/**
	 * Removes the recovery wrap. Forbidden in zero-knowledge mode (would
	 * leave the user with no usable wrap and no way to unlock).
	 */
	async clearRecoveryWrap(userId: string, ctx: AuditContext = {}): Promise<void> {
		return this.withUserScope(userId, async (tx) => {
			const existing = await tx
				.select()
				.from(encryptionVaults)
				.where(eq(encryptionVaults.userId, userId))
				.limit(1);

			if (existing.length === 0) {
				await this.writeAudit(tx, userId, 'recovery_clear', ctx, 404, 'no-vault');
				throw new VaultNotFoundError(userId);
			}
			if (existing[0].zeroKnowledge) {
				await this.writeAudit(tx, userId, 'recovery_clear', ctx, 409, 'zk-active');
				throw new ZeroKnowledgeActiveError(userId);
			}

			await tx
				.update(encryptionVaults)
				.set({
					recoveryWrappedMk: null,
					recoveryIv: null,
					recoverySetAt: null,
				})
				.where(eq(encryptionVaults.userId, userId));

			await this.writeAudit(tx, userId, 'recovery_clear', ctx, 200, null);
		});
	}

	/**
	 * Enables zero-knowledge mode. NULLs out wrapped_mk + wrap_iv,
	 * sets zero_knowledge=true. After this, the server is computationally
	 * incapable of decrypting the user's data — even with full DB +
	 * KEK access — until the user provides the recovery code on the
	 * next unlock.
	 *
	 * Precondition: a recovery wrap MUST already be stored. Without it,
	 * enabling zero-knowledge would lock the user out forever (the CHECK
	 * constraint enforces this at the DB level too).
	 *
	 * This is the destructive step. The UI should require an explicit
	 * confirmation modal — there is no undo without first calling
	 * `disableZeroKnowledge`, which itself requires a freshly-unwrapped
	 * MK from the client side.
	 */
	async enableZeroKnowledge(userId: string, ctx: AuditContext = {}): Promise<void> {
		return this.withUserScope(userId, async (tx) => {
			const rows = await tx
				.select()
				.from(encryptionVaults)
				.where(eq(encryptionVaults.userId, userId))
				.limit(1);

			if (rows.length === 0) {
				await this.writeAudit(tx, userId, 'zk_enable', ctx, 404, 'no-vault');
				throw new VaultNotFoundError(userId);
			}
			if (rows[0].zeroKnowledge) {
				// Already enabled — idempotent no-op so retried calls don't
				// look like errors.
				await this.writeAudit(tx, userId, 'zk_enable', ctx, 200, 'already-enabled');
				return;
			}
			if (!rows[0].recoveryWrappedMk || !rows[0].recoveryIv) {
				await this.writeAudit(tx, userId, 'zk_enable', ctx, 400, 'no-recovery-wrap');
				throw new RecoveryWrapMissingError(userId);
			}

			await tx
				.update(encryptionVaults)
				.set({
					zeroKnowledge: true,
					wrappedMk: null,
					wrapIv: null,
				})
				.where(eq(encryptionVaults.userId, userId));

			await this.writeAudit(tx, userId, 'zk_enable', ctx, 200, null);
		});
	}

	/**
	 * Disables zero-knowledge mode. The client must hand back a fresh
	 * KEK-friendly master key (i.e. the same MK it just unwrapped with
	 * the recovery code, re-supplied so the server can KEK-wrap it).
	 *
	 * Why doesn't the server generate a new MK? Because that would
	 * orphan all existing encrypted data. The user-side workflow is:
	 *   1. Unlock with recovery code (client now has the plaintext MK)
	 *   2. POST /zero-knowledge/disable with `{ masterKey: base64(MK) }`
	 *   3. Server KEK-wraps the supplied MK and stores it as wrapped_mk
	 *   4. zero_knowledge flips back to false
	 *
	 * The client SHOULD memzero its copy of the MK bytes after the call.
	 */
	async disableZeroKnowledge(
		userId: string,
		mkBytes: Uint8Array,
		ctx: AuditContext = {}
	): Promise<void> {
		return this.withUserScope(userId, async (tx) => {
			const rows = await tx
				.select()
				.from(encryptionVaults)
				.where(eq(encryptionVaults.userId, userId))
				.limit(1);

			if (rows.length === 0) {
				await this.writeAudit(tx, userId, 'zk_disable', ctx, 404, 'no-vault');
				throw new VaultNotFoundError(userId);
			}
			if (!rows[0].zeroKnowledge) {
				await this.writeAudit(tx, userId, 'zk_disable', ctx, 200, 'already-disabled');
				return;
			}

			const { wrappedMk, wrapIv } = await wrapMasterKey(mkBytes);

			await tx
				.update(encryptionVaults)
				.set({
					zeroKnowledge: false,
					wrappedMk,
					wrapIv,
					kekId: activeKekId(),
				})
				.where(eq(encryptionVaults.userId, userId));

			await this.writeAudit(tx, userId, 'zk_disable', ctx, 200, null);
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
		action:
			| 'init'
			| 'fetch'
			| 'rotate'
			| 'failed_fetch'
			| 'recovery_set'
			| 'recovery_clear'
			| 'zk_enable'
			| 'zk_disable',
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

/**
 * Thrown when the client tries to enable zero-knowledge mode without
 * first storing a recovery wrap. Routes convert to 400.
 */
export class RecoveryWrapMissingError extends Error {
	constructor(public userId: string) {
		super(`cannot enable zero-knowledge mode: no recovery wrap stored for user ${userId}`);
		this.name = 'RecoveryWrapMissingError';
	}
}

/**
 * Thrown when the client tries to clear the recovery wrap while
 * zero-knowledge mode is active (would lock the user out). Routes
 * convert to 409.
 */
export class ZeroKnowledgeActiveError extends Error {
	constructor(public userId: string) {
		super(`cannot clear recovery wrap while zero-knowledge mode is active for user ${userId}`);
		this.name = 'ZeroKnowledgeActiveError';
	}
}

/**
 * Thrown when rotate() is called on a vault in zero-knowledge mode.
 * Routes convert to 409.
 */
export class ZeroKnowledgeRotateForbidden extends Error {
	constructor(public userId: string) {
		super(`cannot rotate master key in zero-knowledge mode for user ${userId}`);
		this.name = 'ZeroKnowledgeRotateForbidden';
	}
}

/** Re-export the type for route handlers. */
export type { EncryptionVault };
