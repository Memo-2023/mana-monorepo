/**
 * Guest → User data migration.
 *
 * In guest mode, the Dexie creating-hook stamps every record with
 * `userId = GUEST_USER_ID`. Sync push is also a no-op while there is no
 * auth token, so the records live purely in the local IndexedDB.
 *
 * When the user signs in for the first time we want their existing local
 * data to be theirs. This module walks every sync-tracked table, finds
 * records owned by `guest`, and re-creates them under the active user id.
 *
 * Why delete-and-re-add instead of an in-place update?
 *   The Dexie updating-hook deliberately strips `userId` from modifications
 *   (immutable once created), and even if we bypassed that, an `op: 'update'`
 *   pending-change would only ship the userId field to the server — other
 *   clients pulling the change would see a fresh record with just an id and
 *   userId. By deleting and re-adding we generate a clean `op: 'insert'`
 *   with the full record payload.
 *
 *   Deleting in guest mode is safe because nothing was ever pushed to the
 *   server: `_pendingChanges` is cleared as part of the migration too, so the
 *   delete is purely local and never reaches the sync layer.
 *
 * Encryption catch-up: while in guest mode, encryptRecord skips silently
 * (no master key available, no auth token to fetch one). Records on
 * encrypted tables therefore live as PLAINTEXT in IndexedDB until this
 * migration runs. After login + vault unlock we walk the same set of
 * records and re-encrypt the registry fields before re-inserting, so
 * the post-migration state is indistinguishable from "user signed up
 * first, then typed everything". The migration awaits the vault for up
 * to 10 s — if it never opens we abort the migration and leave the
 * guest data in place rather than re-inserting plaintext under the
 * real user id.
 */

import { db, SYNC_APP_MAP, FIELD_META_KEY } from './database';
import { GUEST_USER_ID } from './current-user';
import { encryptRecord } from './crypto/record-helpers';
import { waitForActiveKey } from './crypto/key-provider';
import { getEncryptedFields } from './crypto/registry';

export interface GuestMigrationResult {
	migratedRecords: number;
	tablesTouched: number;
}

/**
 * Re-stamps every `userId === 'guest'` record under the active user id.
 *
 * Caller must ensure `setCurrentUserId(newUserId)` was already invoked so
 * that the Dexie creating-hook picks up the right id when re-inserting.
 */
export async function migrateGuestDataToUser(newUserId: string): Promise<GuestMigrationResult> {
	if (!newUserId || newUserId === GUEST_USER_ID) {
		return { migratedRecords: 0, tablesTouched: 0 };
	}

	// Wait for the vault to unlock before we touch anything. The layout
	// fires this migration and `vaultClient.unlock()` in the same
	// effect run, so they race; if we re-insert plaintext under the
	// real user id before the key arrives, those records would have to
	// be re-encrypted by a follow-up pass that doesn't exist. Bail out
	// instead — the guest data stays put and the user can retry by
	// signing out and back in.
	const key = await waitForActiveKey(10_000);
	if (!key) {
		console.warn('[mana] guest migration aborted: vault did not unlock in time');
		return { migratedRecords: 0, tablesTouched: 0 };
	}

	// Drop any pending changes accumulated during guest mode — they were
	// never pushed (no auth token) and reference the old guest userId. The
	// re-inserts below will produce fresh pending changes that should NOT be
	// wiped, so this MUST happen before the migration loop.
	await db.table('_pendingChanges').clear();

	let migratedRecords = 0;
	let tablesTouched = 0;

	for (const tables of Object.values(SYNC_APP_MAP)) {
		for (const tableName of tables) {
			const table = db.table(tableName);

			// Filter scan: userId is not indexed (and we don't want to widen the
			// schema for a one-shot migration). Tables are typically small at
			// this point because guest mode only stores what one person typed.
			const guestRecords = await table
				.filter((r: unknown) => (r as Record<string, unknown>).userId === GUEST_USER_ID)
				.toArray();

			if (guestRecords.length === 0) continue;
			tablesTouched++;

			// Snapshot the encrypted-field allowlist once per table (null if
			// the table is not in the registry or currently disabled).
			const encryptedFields = getEncryptedFields(tableName);

			// One transaction per table keeps the delete+add pair atomic and
			// avoids leaving the table half-migrated if Dexie throws partway.
			// Note: encryptRecord is async and uses Web Crypto, which is fine
			// inside a Dexie 'rw' transaction as long as we don't await
			// non-Dexie work between Dexie ops in a way that suspends the
			// transaction. Each iteration awaits the encrypt BEFORE touching
			// the table, then runs the delete+add pair back-to-back.
			await db.transaction('rw', table, async () => {
				for (const oldRecord of guestRecords) {
					const record = oldRecord as Record<string, unknown>;
					const id = record.id as string;

					// Strip the bookkeeping fields the creating-hook will rebuild.
					// Importantly, drop `userId` so the hook stamps the new id from
					// getEffectiveUserId() instead of preserving 'guest'.
					const { userId: _oldUser, [FIELD_META_KEY]: _oldMeta, ...clean } = record;
					void _oldUser;
					void _oldMeta;

					// Catch-up encryption: guest writes left these fields as
					// plaintext because no key was available. Now that the
					// vault is unlocked, encrypt them in place before the
					// re-insert so the on-disk state matches a "logged in
					// from the start" user. encryptRecord is a no-op for
					// tables not in the registry, and idempotent for fields
					// that are somehow already encrypted (e.g. partial
					// migration retry after a crash).
					if (encryptedFields) {
						await encryptRecord(tableName, clean);
					}

					await table.delete(id);
					await table.add({ ...clean, id });
					migratedRecords++;
				}
			});
		}
	}

	return { migratedRecords, tablesTouched };
}
