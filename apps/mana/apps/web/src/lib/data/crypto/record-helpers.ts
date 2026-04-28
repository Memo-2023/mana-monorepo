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
import { getActiveKey, isVaultUnlocked, waitForActiveKey } from './key-provider';
import { getEncryptedFields } from './registry';
import { getCurrentUserId } from '../current-user';
import { getActiveSpace } from '../scope/active-space.svelte';

/**
 * Phase-1 Spaces decision: personal-Space data is encrypted with the
 * user's master key (E2E as today); shared-Space data (brand/club/family
 * /team/practice) is plaintext at rest and protected by server RLS only.
 *
 * Deciding at write time:
 *   - spaceId is the `_personal:<userId>` sentinel → personal, encrypt.
 *     Happens during the bootstrap window before reconcileSentinels() has
 *     rewritten the placeholder to the real personal-space id.
 *   - Active space is resolved and type='personal' → encrypt.
 *   - Active space is any other type → skip.
 *   - Record has no spaceId at all (legacy rows, guest mode) → encrypt
 *     (safer default; personal-space is what the app defaults to).
 *
 * A shared-Space encryption-with-shared-key scheme will replace this
 * later; see docs/plans/spaces-foundation.md §"Shared-space encryption".
 */
function isPersonalScope(record: Record<string, unknown>): boolean {
	const spaceId = record.spaceId;
	if (typeof spaceId === 'string' && spaceId.startsWith('_personal:')) {
		return true;
	}
	const active = getActiveSpace();
	if (active && active.type !== 'personal') {
		// Only skip when we can confidently say the write belongs to a
		// shared space. If the record's spaceId matches some other space's
		// id, the check would need a lookup — for now the active-space
		// type is the authoritative signal at write time.
		if (typeof spaceId === 'string' && spaceId === active.id) {
			return false;
		}
	}
	return true;
}

/** Thrown by encryptRecord when no key is available. Module stores
 *  catch this to surface "vault locked" UI. */
export class VaultLockedError extends Error {
	constructor(public tableName: string) {
		super(`mana-crypto: vault is locked, cannot encrypt fields for table '${tableName}'`);
		this.name = 'VaultLockedError';
	}
}

/**
 * Dev-only registry-vs-record shape check.
 *
 * Called from encryptRecord when `import.meta.env.DEV` is truthy (Vite
 * strips the call in production builds). Catches the genuine silent
 * failure mode: a registry entry names a field the record has only
 * under a case-mismatched key. Without this warning, the typo'd field
 * stays plaintext forever and no error is ever thrown.
 *
 * What the check explicitly does NOT flag:
 *   - Records that have NONE of the registered fields. Many call sites
 *     legitimately encrypt records before any optional encrypted field
 *     has been set (e.g. `ensureDefaultAgent` writes a fresh agent row
 *     without a `systemPrompt` or `memory` yet — those are filled in
 *     later when the user customises the agent). Encrypting such a
 *     record is a no-op anyway, so warning is pure noise.
 *   - Optional fields that just happen to be undefined for this write.
 *     Same reason — no leak possible without a value to leak.
 *
 * Throttled per (tableName, field) pair so liveQuery loops don't spam.
 */
const _registryWarnings = new Set<string>();
function devCheckRegistryShape(
	tableName: string,
	record: Record<string, unknown>,
	fields: readonly string[]
): void {
	const recordKeys = Object.keys(record);
	const recordKeySet = new Set(recordKeys);
	const lcMap = new Map<string, string>();
	for (const k of recordKeys) lcMap.set(k.toLowerCase(), k);

	for (const field of fields) {
		if (recordKeySet.has(field)) continue;
		// Case-insensitive near-miss → almost certainly a typo in the registry.
		const near = lcMap.get(field.toLowerCase());
		if (near && near !== field) {
			const key = `${tableName}.${field}`;
			if (!_registryWarnings.has(key)) {
				_registryWarnings.add(key);
				console.error(
					`[mana-crypto] DEV: registry field '${field}' not on ${tableName} record, ` +
						`but case-insensitive match '${near}' exists. Registry typo? ` +
						`This field is SILENTLY staying plaintext in production.`
				);
			}
		}
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

	// Phase-1 Spaces: shared-Space records skip encryption so co-members
	// can read them (they don't have the author's master key). Personal
	// data stays E2E.
	if (!isPersonalScope(view)) {
		return record;
	}

	if (import.meta.env.DEV) devCheckRegistryShape(tableName, view, fields);

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

	// Guest mode: there is no auth token, so the server vault is
	// unreachable by definition. Falling back to plaintext keeps the
	// app usable for anonymous local-first writes — guestMigration.ts
	// will encrypt these records as part of the guest → user re-stamp
	// when the user eventually signs in. The compromise is documented
	// in the data-layer audit; the alternative (refusing the write)
	// hides the entire app behind a sign-up wall.
	if (getCurrentUserId() === null) {
		console.debug(`[mana-crypto] encryptRecord(${tableName}) — guest mode, writing plaintext`);
		return record;
	}

	// Boot-time race: the layout's `vaultClient.unlock()` runs in the
	// same tick as authStore.initialize(), so the very first user
	// mutation can land before the network round-trip finishes. Wait a
	// short window for the provider to flip before we give up — this
	// converts a near-miss race into a transparent ~ms delay instead of
	// a thrown VaultLockedError that the UI silently swallows.
	let key = getActiveKey();
	if (!key) key = await waitForActiveKey(2000);
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
/** Throttle "vault locked" warnings so liveQuery refreshes don't spam the console. */
const _lockedWarnings = new Set<string>();

export async function decryptRecord<T extends object>(tableName: string, record: T): Promise<T> {
	const fields = getEncryptedFields(tableName);
	if (!fields) return record;

	const key = getActiveKey();
	if (!key) {
		// Log once per table to avoid flooding the console from liveQuery loops
		if (!_lockedWarnings.has(tableName)) {
			_lockedWarnings.add(tableName);
			console.warn(
				`[mana-crypto] decryptRecord(${tableName}) — vault is LOCKED, returning encrypted blobs as-is. ` +
					`Encrypted fields: [${fields.join(', ')}]`
			);
		}
		return record; // locked: leave blobs as-is
	}
	// Clear the throttle flag so we log again if the vault re-locks later
	_lockedWarnings.delete(tableName);

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
				`[mana-crypto] decrypt FAILED for ${tableName}.${field}: ${(err as Error).message}`
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
	const fields = getEncryptedFields(tableName);
	if (fields && !isVaultUnlocked() && records.length > 0) {
		console.warn(
			`[mana-crypto] decryptRecords(${tableName}) — ${records.length} record(s) will stay encrypted (vault locked)`
		);
	}
	const out: T[] = [];
	for (const r of records) {
		if (r) out.push(await decryptRecord(tableName, r));
	}
	return out;
}

/** Re-export so callers don't need to reach into key-provider.ts. */
export { isVaultUnlocked };
