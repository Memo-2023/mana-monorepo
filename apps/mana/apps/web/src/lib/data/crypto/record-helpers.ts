/**
 * Record-level encrypt/decrypt helpers driven by the registry.
 *
 * Module stores call `encryptRecord(tableName, record)` before
 * `table.add(record)` / `table.update(id, record)`. Module read paths
 * call `decryptRecord(tableName, record)` after `table.get(id)` /
 * `liveQuery(...)`.
 *
 * Why explicit calls instead of transparent Dexie hooks?
 *   - Dexie hooks are synchronous; Web Crypto is async. Wrapping the
 *     hook in a sync polyfill (stablelib) would add ~10 KB and slow
 *     every write down by ~3x. Explicit async calls keep the hot path
 *     on native crypto.
 *   - Pilot rollout is easier: notes can adopt encryption without
 *     touching todo, calendar, etc.
 *   - Tests are simpler: no need to mock Dexie hook timing.
 *
 * What happens if the vault is locked?
 *   - encryptRecord throws `VaultLockedError`. Module stores let it
 *     bubble; the UI layer turns it into a "you need to unlock first"
 *     toast. The user-visible write fails fast — no plaintext sneaks
 *     through.
 *   - decryptRecord returns the record unchanged (encrypted blobs stay
 *     opaque), so views can still render the structural fields and
 *     show a "🔒 locked" placeholder where the encrypted ones used to
 *     be.
 *
 * What about server-applied changes?
 *   - applyServerChanges in sync.ts treats encrypted fields as opaque
 *     strings. The server stores blobs, the client stores blobs. The
 *     decrypt happens at READ time via decryptRecord, not at apply
 *     time. This means LWW continues to compare timestamps (plaintext
 *     metadata) without ever touching the ciphertext.
 */

import { wrapValue, unwrapValue, isEncrypted } from './aes';
import { getActiveKey, isVaultUnlocked } from './key-provider';
import { getEncryptedFields } from './registry';

/** Thrown by encryptRecord when no key is available. Module stores
 *  catch this to surface "vault locked" UI. */
export class VaultLockedError extends Error {
	constructor(public tableName: string) {
		super(`mana-crypto: vault is locked, cannot encrypt fields for table '${tableName}'`);
		this.name = 'VaultLockedError';
	}
}

/**
 * Encrypts the configured fields of `record` in place. Returns the
 * same record reference for chaining. No-op if the table is not in
 * the registry, the registry entry is disabled, or every configured
 * field is null/undefined.
 *
 * Throws VaultLockedError if at least one field would need encryption
 * but no master key is available. Callers can pre-check with
 * `isVaultUnlocked()` to surface a friendlier error.
 *
 * Generic constraint: `T extends object` so domain interfaces (LocalNote,
 * LocalMessage, etc.) can be passed directly without an explicit
 * `as Record<string, unknown>` cast at every call site. Internal
 * field reads/writes go through a Record<string, unknown> view.
 */
export async function encryptRecord<T extends object>(tableName: string, record: T): Promise<T> {
	const fields = getEncryptedFields(tableName);
	if (!fields) return record;
	const view = record as unknown as Record<string, unknown>;

	// Build the work list first so we don't half-encrypt a record on
	// vault-locked failure mid-loop.
	const todo: string[] = [];
	for (const field of fields) {
		const value = view[field];
		if (value === null || value === undefined) continue;
		// Already encrypted? Skip — happens when applyServerChanges
		// hands a record (with encrypted blobs from the wire) back
		// through the same code path on a re-emit / liveQuery refresh.
		if (typeof value === 'string' && isEncrypted(value)) continue;
		todo.push(field);
	}
	if (todo.length === 0) return record;

	const key = getActiveKey();
	if (!key) throw new VaultLockedError(tableName);

	for (const field of todo) {
		view[field] = await wrapValue(view[field], key);
	}
	return record;
}

/**
 * Decrypts the configured fields of `record` in place. Returns the
 * same record reference. No-op if the table is not in the registry,
 * the registry entry is disabled, or every encrypted field is missing.
 *
 * Locked-vault behaviour: leaves encrypted blobs in place rather than
 * throwing. Views are expected to handle the blob → "🔒" rendering
 * themselves. Plaintext fields (id, timestamps, status) stay readable.
 */
export async function decryptRecord<T extends object>(tableName: string, record: T): Promise<T> {
	const fields = getEncryptedFields(tableName);
	if (!fields) return record;

	const key = getActiveKey();
	if (!key) return record; // locked: leave blobs as-is

	const view = record as unknown as Record<string, unknown>;
	for (const field of fields) {
		const value = view[field];
		if (typeof value !== 'string' || !isEncrypted(value)) continue;
		try {
			view[field] = await unwrapValue(value, key);
		} catch (err) {
			// Don't kill the read just because one field is corrupt or
			// keyed to a previous master. Log + leave the blob in place
			// so the UI can show a "decryption failed" marker.
			console.error(
				`[mana-crypto] decrypt failed for ${tableName}.${field}: ${(err as Error).message}`
			);
		}
	}
	return record;
}

/**
 * Convenience for liveQuery / array results — applies decryptRecord
 * to every entry and returns a fresh array of the same length. Skips
 * null entries (e.g. from `getMany([id1, id2])` when one is missing).
 */
export async function decryptRecords<T extends object>(
	tableName: string,
	records: (T | null | undefined)[]
): Promise<T[]> {
	const out: T[] = [];
	for (const r of records) {
		if (r) out.push(await decryptRecord(tableName, r));
	}
	return out;
}

/** Re-export so callers don't need to reach into key-provider.ts. */
export { isVaultUnlocked };
