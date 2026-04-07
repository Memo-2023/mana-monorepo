import { text, timestamp, smallint, integer, boolean, index } from 'drizzle-orm/pg-core';
import { authSchema, users } from './auth';

/**
 * Per-user encryption vault.
 *
 * Holds the user's master key (MK) — wrapped with the service-wide Key
 * Encryption Key (KEK). The MK itself is never stored in plaintext.
 * Browsers fetch the unwrapped MK at login via `GET /api/v1/me/encryption-key`
 * and keep it in sessionStorage for the duration of the session.
 *
 * Wire format of the wrapped key:
 *   AES-GCM-256 over the raw 32-byte MK, with the KEK as key.
 *   wrapped_mk = AES-GCM-encrypt(MK, KEK, wrap_iv) → ciphertext + 16-byte auth tag.
 *   The auth tag is appended to wrapped_mk by the Web Crypto / Bun crypto API.
 *
 * Why a separate table (and not a column on users)?
 *   - Lifecycle is independent: a user can rotate their vault without
 *     touching the user record, and vice versa.
 *   - Permissions: only the dedicated vault service touches this table,
 *     so it's easy to grant minimal access via row-level security and
 *     restrict the audit surface.
 *   - Future-proofing: when we add per-device sub-keys or recovery wraps,
 *     they sit naturally next to the master entry.
 *
 * RLS is added via raw SQL in the migration file alongside the table.
 * The migration enables ROW LEVEL SECURITY + FORCE so that even the
 * mana-auth service role cannot read another user's vault entry without
 * going through `set_config('app.current_user_id', ...)` first.
 */
export const encryptionVaults = authSchema.table(
	'encryption_vaults',
	{
		userId: text('user_id')
			.primaryKey()
			.references(() => users.id, { onDelete: 'cascade' }),

		/** AES-GCM ciphertext of the raw 32-byte master key, wrapped with
		 *  the server-side KEK. Includes the 16-byte authentication tag at
		 *  the tail (Web Crypto convention).
		 *
		 *  NULLABLE since Phase 9: a vault in zero-knowledge mode has no
		 *  server-side wrap. The CHECK constraint
		 *  `encryption_vaults_has_wrap` ensures at least one of
		 *  (wrapped_mk, recovery_wrapped_mk) is always populated so the
		 *  user can never be locked out. */
		wrappedMk: text('wrapped_mk'),

		/** 12-byte IV used for the wrap operation. Stored base64. NULLABLE
		 *  in lockstep with wrappedMk. */
		wrapIv: text('wrap_iv'),

		/** Wire format version of the KEK wrap. Lets us migrate to a
		 *  different KDF or AEAD later without rewriting every existing
		 *  row at once. */
		formatVersion: smallint('format_version').notNull().default(1),

		/** KEK identifier — currently always 'env-v1' (the env-loaded KEK).
		 *  Will become a KMS key ARN / Vault path / etc. when we move
		 *  off the env-var KEK. Stored so a future rotation knows which
		 *  KEK to unwrap with. */
		kekId: text('kek_id').notNull().default('env-v1'),

		// ─── Phase 9: Recovery wrap (zero-knowledge opt-in) ───
		//
		// recovery_wrapped_mk holds the same master key, wrapped with a
		// key derived from the user's 32-byte recovery secret via HKDF.
		// The server NEVER sees the recovery secret itself — it only
		// accepts the already-sealed blob from the client. The client
		// generates + displays the recovery code at setup time and the
		// user is responsible for backing it up.
		//
		// When zero_knowledge=true:
		//   - wrapped_mk + wrap_iv are NULL (the KEK wrap is gone)
		//   - recovery_wrapped_mk + recovery_iv are NOT NULL
		//   - GET /key returns the recovery blob, NOT a plaintext MK
		//   - The server is computationally incapable of decrypting the
		//     user's data even with full DB + KEK access

		/** AES-GCM ciphertext of the raw 32-byte master key, wrapped with
		 *  the user's recovery-derived key. NULL until the user opts into
		 *  recovery wrap via POST /recovery-wrap. */
		recoveryWrappedMk: text('recovery_wrapped_mk'),

		/** 12-byte IV for the recovery wrap. Stored base64. Paired with
		 *  recoveryWrappedMk via the encryption_vaults_wrap_iv_pair
		 *  constraint. */
		recoveryIv: text('recovery_iv'),

		/** Wire format version of the recovery wrap. */
		recoveryFormatVersion: smallint('recovery_format_version').notNull().default(1),

		/** Timestamp of when the user first set their recovery wrap. */
		recoverySetAt: timestamp('recovery_set_at', { withTimezone: true }),

		/** True iff the user has opted into zero-knowledge mode. When set,
		 *  the server-side wrapped_mk is gone and the user MUST provide
		 *  their recovery code to unlock the vault. */
		zeroKnowledge: boolean('zero_knowledge').notNull().default(false),

		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		rotatedAt: timestamp('rotated_at', { withTimezone: true }),
	},
	(table) => [index('encryption_vaults_user_id_idx').on(table.userId)]
);

export type EncryptionVault = typeof encryptionVaults.$inferSelect;
export type NewEncryptionVault = typeof encryptionVaults.$inferInsert;

/**
 * Append-only audit trail of vault accesses (init, fetch, rotate). Used
 * for security investigations and compliance reporting. Not exposed to
 * users — only the admin endpoints can read this.
 *
 * Why a separate table instead of dumping into a generic audit log?
 *   - Encryption vault access is the highest-sensitivity operation in
 *     the entire system; a dedicated table makes the threat-monitoring
 *     query trivial ("show me all fetches in the last 24h grouped by
 *     IP / user-agent").
 *   - Retention can be tuned independently (longer than ordinary auth
 *     logs to support late-discovered breaches).
 */
export const encryptionVaultAudit = authSchema.table(
	'encryption_vault_audit',
	{
		id: text('id').primaryKey(), // nanoid
		userId: text('user_id')
			.references(() => users.id, { onDelete: 'cascade' })
			.notNull(),
		action: text('action').notNull(), // 'init' | 'fetch' | 'rotate' | 'failed_fetch'
		ipAddress: text('ip_address'),
		userAgent: text('user_agent'),
		/** Free-form context (e.g. failure reason, format version touched). */
		context: text('context'),
		/** HTTP status returned to the client — useful for spotting probing. */
		status: integer('status').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index('encryption_vault_audit_user_id_idx').on(table.userId),
		index('encryption_vault_audit_created_at_idx').on(table.createdAt),
	]
);

export type EncryptionVaultAudit = typeof encryptionVaultAudit.$inferSelect;
export type NewEncryptionVaultAudit = typeof encryptionVaultAudit.$inferInsert;
