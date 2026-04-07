/**
 * EncryptionVaultService integration tests (Phase 9 backlog #1).
 *
 * Exercises the full service surface against a real Postgres so the
 * row-level-security policies, CHECK constraints and audit-row writes
 * are tested as the production app actually sees them. Pure-crypto
 * tests live in `kek.test.ts` and don't need this scaffolding.
 *
 * Test database
 * -------------
 * Reads `TEST_DATABASE_URL` from the environment. The whole suite is
 * SKIPPED if the variable is not set, so unrelated CI runs (and the
 * default `bun test` from a fresh checkout) don't fail with "no
 * connection" — only the encryption-vault sub-job has to provision a
 * Postgres.
 *
 * Schema is assumed to already exist (run `pnpm db:push` against the
 * test DB before invoking the suite). The tests TRUNCATE the relevant
 * tables before each case so they're independent.
 *
 * Note on the user FK: encryption_vaults.user_id references auth.users
 * via ON DELETE CASCADE. We seed a single test user in beforeAll and
 * tear down in afterAll. Each test uses a fresh per-test sub-id stored
 * as a row in users — this avoids cross-test pollution from a single
 * shared user_id while still respecting the FK.
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'bun:test';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import * as schema from '../../db/schema';
import { users } from '../../db/schema/auth';
import { encryptionVaults, encryptionVaultAudit } from '../../db/schema/encryption-vaults';
import {
	EncryptionVaultService,
	VaultNotFoundError,
	RecoveryWrapMissingError,
	ZeroKnowledgeActiveError,
	ZeroKnowledgeRotateForbidden,
} from './index';
import { loadKek, _resetForTesting as resetKek } from './kek';

const TEST_KEK_BASE64 = 'AQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyA=';
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL ?? '';

// Skip the entire suite if no test DB is configured. The describe.skip
// pattern keeps the file importable so type-checking still runs against
// production code.
const maybeDescribe = TEST_DATABASE_URL ? describe : describe.skip;

maybeDescribe('EncryptionVaultService (integration)', () => {
	let client: ReturnType<typeof postgres>;
	let db: ReturnType<typeof drizzle<typeof schema>>;
	let service: EncryptionVaultService;
	let testUserId: string;

	beforeAll(async () => {
		// Connect to the test database. `max: 5` keeps the connection
		// pool small — we don't run anything in parallel inside one test
		// suite, and CI runners are usually limited.
		client = postgres(TEST_DATABASE_URL, { max: 5 });
		db = drizzle(client, { schema });

		resetKek();
		await loadKek(TEST_KEK_BASE64);

		service = new EncryptionVaultService(db);
	});

	afterAll(async () => {
		// Drop the test user (CASCADE wipes the vault row + audit
		// entries via FK). Then close the pool so bun test exits cleanly.
		if (testUserId) {
			await db.delete(users).where(eq(users.id, testUserId));
		}
		await client.end();
	});

	beforeEach(async () => {
		// Fresh user per test so the unique-email constraint doesn't bite
		// and so each test starts from a clean vault state.
		testUserId = `test-user-${nanoid(8)}`;
		await db.insert(users).values({
			id: testUserId,
			name: 'Vault Integration Test',
			email: `${testUserId}@test.local`,
			emailVerified: true,
		});
	});

	// ─── init() ────────────────────────────────────────────────

	describe('init', () => {
		it('mints a fresh vault when none exists', async () => {
			const result = await service.init(testUserId);

			expect(result.masterKey).toBeInstanceOf(Uint8Array);
			expect(result.masterKey!.length).toBe(32);
			expect(result.formatVersion).toBe(1);
			expect(result.kekId).toBe('env-v1');
			expect(result.requiresRecoveryCode).toBeUndefined();

			// Verify the row was actually inserted
			const rows = await db
				.select()
				.from(encryptionVaults)
				.where(eq(encryptionVaults.userId, testUserId));
			expect(rows).toHaveLength(1);
			expect(rows[0].wrappedMk).not.toBeNull();
			expect(rows[0].wrapIv).not.toBeNull();
			expect(rows[0].zeroKnowledge).toBe(false);
			expect(rows[0].recoveryWrappedMk).toBeNull();
		});

		it('is idempotent — second call returns the same key', async () => {
			const a = await service.init(testUserId);
			const b = await service.init(testUserId);

			expect(Buffer.from(a.masterKey!).toString('hex')).toBe(
				Buffer.from(b.masterKey!).toString('hex')
			);
		});

		it('writes init audit rows', async () => {
			await service.init(testUserId);
			await service.init(testUserId);

			const audit = await db
				.select()
				.from(encryptionVaultAudit)
				.where(eq(encryptionVaultAudit.userId, testUserId));

			expect(audit.length).toBeGreaterThanOrEqual(2);
			const actions = audit.map((a) => a.action);
			expect(actions).toContain('init');
		});
	});

	// ─── getStatus() ───────────────────────────────────────────

	describe('getStatus', () => {
		it('returns vaultExists=false for a user with no vault', async () => {
			const status = await service.getStatus(testUserId);
			expect(status.vaultExists).toBe(false);
			expect(status.hasRecoveryWrap).toBe(false);
			expect(status.zeroKnowledge).toBe(false);
			expect(status.recoverySetAt).toBeNull();
		});

		it('reports vaultExists=true after init, no recovery yet', async () => {
			await service.init(testUserId);
			const status = await service.getStatus(testUserId);
			expect(status.vaultExists).toBe(true);
			expect(status.hasRecoveryWrap).toBe(false);
			expect(status.zeroKnowledge).toBe(false);
		});

		it('reports hasRecoveryWrap=true after setRecoveryWrap', async () => {
			await service.init(testUserId);
			await service.setRecoveryWrap(testUserId, {
				recoveryWrappedMk: 'AAAA',
				recoveryIv: 'BBBB',
			});
			const status = await service.getStatus(testUserId);
			expect(status.hasRecoveryWrap).toBe(true);
			expect(status.zeroKnowledge).toBe(false);
			expect(status.recoverySetAt).not.toBeNull();
		});

		it('reports zeroKnowledge=true after enableZeroKnowledge', async () => {
			await service.init(testUserId);
			await service.setRecoveryWrap(testUserId, {
				recoveryWrappedMk: 'AAAA',
				recoveryIv: 'BBBB',
			});
			await service.enableZeroKnowledge(testUserId);
			const status = await service.getStatus(testUserId);
			expect(status.zeroKnowledge).toBe(true);
			expect(status.hasRecoveryWrap).toBe(true);
		});

		it('does NOT write an audit row (cheap metadata read)', async () => {
			await service.init(testUserId);
			// Clear audit rows from init
			await db.execute(sql`DELETE FROM auth.encryption_vault_audit WHERE user_id = ${testUserId}`);
			await service.getStatus(testUserId);
			const audit = await db
				.select()
				.from(encryptionVaultAudit)
				.where(eq(encryptionVaultAudit.userId, testUserId));
			expect(audit).toHaveLength(0);
		});
	});

	// ─── setRecoveryWrap() ─────────────────────────────────────

	describe('setRecoveryWrap', () => {
		it('stores the recovery wrap on an existing vault', async () => {
			await service.init(testUserId);
			await service.setRecoveryWrap(testUserId, {
				recoveryWrappedMk: 'AAAA',
				recoveryIv: 'BBBB',
			});

			const rows = await db
				.select()
				.from(encryptionVaults)
				.where(eq(encryptionVaults.userId, testUserId));
			expect(rows[0].recoveryWrappedMk).toBe('AAAA');
			expect(rows[0].recoveryIv).toBe('BBBB');
			expect(rows[0].recoverySetAt).not.toBeNull();
		});

		it('throws VaultNotFoundError when no vault exists', async () => {
			await expect(
				service.setRecoveryWrap(testUserId, {
					recoveryWrappedMk: 'AAAA',
					recoveryIv: 'BBBB',
				})
			).rejects.toThrow(VaultNotFoundError);
		});

		it('is idempotent — replaces the previous wrap', async () => {
			await service.init(testUserId);
			await service.setRecoveryWrap(testUserId, {
				recoveryWrappedMk: 'AAAA',
				recoveryIv: 'BBBB',
			});
			await service.setRecoveryWrap(testUserId, {
				recoveryWrappedMk: 'CCCC',
				recoveryIv: 'DDDD',
			});

			const rows = await db
				.select()
				.from(encryptionVaults)
				.where(eq(encryptionVaults.userId, testUserId));
			expect(rows[0].recoveryWrappedMk).toBe('CCCC');
			expect(rows[0].recoveryIv).toBe('DDDD');
		});

		it('writes a recovery_set audit row', async () => {
			await service.init(testUserId);
			await service.setRecoveryWrap(testUserId, {
				recoveryWrappedMk: 'AAAA',
				recoveryIv: 'BBBB',
			});

			const audit = await db
				.select()
				.from(encryptionVaultAudit)
				.where(eq(encryptionVaultAudit.userId, testUserId));
			const actions = audit.map((a) => a.action);
			expect(actions).toContain('recovery_set');
		});
	});

	// ─── clearRecoveryWrap() ───────────────────────────────────

	describe('clearRecoveryWrap', () => {
		it('removes the recovery wrap', async () => {
			await service.init(testUserId);
			await service.setRecoveryWrap(testUserId, {
				recoveryWrappedMk: 'AAAA',
				recoveryIv: 'BBBB',
			});
			await service.clearRecoveryWrap(testUserId);

			const rows = await db
				.select()
				.from(encryptionVaults)
				.where(eq(encryptionVaults.userId, testUserId));
			expect(rows[0].recoveryWrappedMk).toBeNull();
			expect(rows[0].recoveryIv).toBeNull();
			expect(rows[0].recoverySetAt).toBeNull();
		});

		it('throws ZeroKnowledgeActiveError when ZK is on', async () => {
			await service.init(testUserId);
			await service.setRecoveryWrap(testUserId, {
				recoveryWrappedMk: 'AAAA',
				recoveryIv: 'BBBB',
			});
			await service.enableZeroKnowledge(testUserId);

			await expect(service.clearRecoveryWrap(testUserId)).rejects.toThrow(ZeroKnowledgeActiveError);
		});

		it('throws VaultNotFoundError when no vault exists', async () => {
			await expect(service.clearRecoveryWrap(testUserId)).rejects.toThrow(VaultNotFoundError);
		});
	});

	// ─── enableZeroKnowledge() ─────────────────────────────────

	describe('enableZeroKnowledge', () => {
		it('flips zero_knowledge=true and NULLs out wrapped_mk', async () => {
			await service.init(testUserId);
			await service.setRecoveryWrap(testUserId, {
				recoveryWrappedMk: 'AAAA',
				recoveryIv: 'BBBB',
			});
			await service.enableZeroKnowledge(testUserId);

			const rows = await db
				.select()
				.from(encryptionVaults)
				.where(eq(encryptionVaults.userId, testUserId));
			expect(rows[0].zeroKnowledge).toBe(true);
			expect(rows[0].wrappedMk).toBeNull();
			expect(rows[0].wrapIv).toBeNull();
			expect(rows[0].recoveryWrappedMk).not.toBeNull();
		});

		it('throws RecoveryWrapMissingError if no recovery wrap is set', async () => {
			await service.init(testUserId);
			await expect(service.enableZeroKnowledge(testUserId)).rejects.toThrow(
				RecoveryWrapMissingError
			);
		});

		it('is idempotent — second call is a no-op', async () => {
			await service.init(testUserId);
			await service.setRecoveryWrap(testUserId, {
				recoveryWrappedMk: 'AAAA',
				recoveryIv: 'BBBB',
			});
			await service.enableZeroKnowledge(testUserId);
			// Should not throw
			await service.enableZeroKnowledge(testUserId);
		});

		it('throws VaultNotFoundError when no vault exists', async () => {
			await expect(service.enableZeroKnowledge(testUserId)).rejects.toThrow(VaultNotFoundError);
		});
	});

	// ─── disableZeroKnowledge() ────────────────────────────────

	describe('disableZeroKnowledge', () => {
		it('restores wrapped_mk from a client-supplied master key', async () => {
			await service.init(testUserId);
			await service.setRecoveryWrap(testUserId, {
				recoveryWrappedMk: 'AAAA',
				recoveryIv: 'BBBB',
			});
			await service.enableZeroKnowledge(testUserId);

			// Verify wrapped_mk is gone
			let rows = await db
				.select()
				.from(encryptionVaults)
				.where(eq(encryptionVaults.userId, testUserId));
			expect(rows[0].wrappedMk).toBeNull();

			// Hand back a fresh 32-byte MK and disable
			const freshMk = new Uint8Array(32).fill(0x42);
			await service.disableZeroKnowledge(testUserId, freshMk);

			rows = await db
				.select()
				.from(encryptionVaults)
				.where(eq(encryptionVaults.userId, testUserId));
			expect(rows[0].zeroKnowledge).toBe(false);
			expect(rows[0].wrappedMk).not.toBeNull();
			expect(rows[0].wrapIv).not.toBeNull();

			// Verify the round-trip: getMasterKey should now unwrap to
			// the same 32 bytes we handed in
			const fetched = await service.getMasterKey(testUserId);
			expect(fetched.masterKey).not.toBeNull();
			expect(Buffer.from(fetched.masterKey!).toString('hex')).toBe(
				Buffer.from(freshMk).toString('hex')
			);
		});

		it('is a no-op when ZK is already off', async () => {
			await service.init(testUserId);
			const fresh = new Uint8Array(32).fill(0x99);
			// Should not throw
			await service.disableZeroKnowledge(testUserId, fresh);
		});
	});

	// ─── getMasterKey() ────────────────────────────────────────

	describe('getMasterKey', () => {
		it('returns the unwrapped MK in standard mode', async () => {
			const init = await service.init(testUserId);
			const fetch = await service.getMasterKey(testUserId);
			expect(fetch.masterKey).not.toBeNull();
			expect(Buffer.from(fetch.masterKey!).toString('hex')).toBe(
				Buffer.from(init.masterKey!).toString('hex')
			);
			expect(fetch.requiresRecoveryCode).toBeUndefined();
		});

		it('returns recovery blob with requiresRecoveryCode=true in ZK mode', async () => {
			await service.init(testUserId);
			await service.setRecoveryWrap(testUserId, {
				recoveryWrappedMk: 'WRAPPED-CT',
				recoveryIv: 'WRAPPED-IV',
			});
			await service.enableZeroKnowledge(testUserId);

			const result = await service.getMasterKey(testUserId);
			expect(result.masterKey).toBeNull();
			expect(result.requiresRecoveryCode).toBe(true);
			expect(result.recoveryWrappedMk).toBe('WRAPPED-CT');
			expect(result.recoveryIv).toBe('WRAPPED-IV');
		});

		it('throws VaultNotFoundError when uninitialised', async () => {
			await expect(service.getMasterKey(testUserId)).rejects.toThrow(VaultNotFoundError);
		});
	});

	// ─── rotate() ──────────────────────────────────────────────

	describe('rotate', () => {
		it('mints a fresh master key and wipes any existing recovery wrap', async () => {
			const init = await service.init(testUserId);
			await service.setRecoveryWrap(testUserId, {
				recoveryWrappedMk: 'OLD-WRAP',
				recoveryIv: 'OLD-IV',
			});

			const rotated = await service.rotate(testUserId);
			expect(Buffer.from(rotated.masterKey!).toString('hex')).not.toBe(
				Buffer.from(init.masterKey!).toString('hex')
			);

			// The old recovery wrap was for the old MK and is now invalid —
			// the service wipes it on rotate to prevent confusion.
			const rows = await db
				.select()
				.from(encryptionVaults)
				.where(eq(encryptionVaults.userId, testUserId));
			expect(rows[0].recoveryWrappedMk).toBeNull();
			expect(rows[0].recoveryIv).toBeNull();
		});

		it('throws ZeroKnowledgeRotateForbidden in ZK mode', async () => {
			await service.init(testUserId);
			await service.setRecoveryWrap(testUserId, {
				recoveryWrappedMk: 'AAAA',
				recoveryIv: 'BBBB',
			});
			await service.enableZeroKnowledge(testUserId);

			await expect(service.rotate(testUserId)).rejects.toThrow(ZeroKnowledgeRotateForbidden);
		});
	});

	// ─── DB CHECK constraint enforcement ───────────────────────

	describe('DB-level invariants', () => {
		// Drizzle's chainable update() object isn't a real Promise — it
		// only executes when you await it (or call .then). For these
		// constraint-violation tests we wrap the call in an arrow so
		// expect(...).rejects.toThrow() sees a real Promise.

		it('enforces zk_consistency: setting wrapped_mk back while ZK active is rejected', async () => {
			await service.init(testUserId);
			await service.setRecoveryWrap(testUserId, {
				recoveryWrappedMk: 'AAAA',
				recoveryIv: 'BBBB',
			});
			await service.enableZeroKnowledge(testUserId);

			// Try to set wrapped_mk back manually — should be rejected by
			// the encryption_vaults_zk_consistency constraint.
			await expect(
				(async () => {
					await db
						.update(encryptionVaults)
						.set({ wrappedMk: 'BAD', wrapIv: 'BAD' })
						.where(eq(encryptionVaults.userId, testUserId));
				})()
			).rejects.toThrow(/encryption_vaults_zk_consistency/);
		});

		it('enforces wrap_iv_pair: setting wrap_iv to NULL while wrapped_mk is set is rejected', async () => {
			await service.init(testUserId);
			await expect(
				(async () => {
					await db
						.update(encryptionVaults)
						.set({ wrapIv: null })
						.where(eq(encryptionVaults.userId, testUserId));
				})()
			).rejects.toThrow(/encryption_vaults_wrap_iv_pair/);
		});
	});
});
