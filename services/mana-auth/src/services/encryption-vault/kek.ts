/**
 * Key Encryption Key (KEK) loader and AES-GCM wrap/unwrap helpers.
 *
 * The KEK is a 32-byte AES-256 key loaded from the MANA_AUTH_KEK env
 * var (base64). It wraps each user's master key (MK) before storage in
 * `auth.encryption_vaults.wrapped_mk`. The KEK itself NEVER touches the
 * database — it lives only in process memory and is sourced from a
 * single environment variable that must be provisioned out of band
 * (Docker secret, KMS-injected, etc.).
 *
 * Why a separate AES-GCM wrap instead of e.g. libsodium SecretBox?
 *   - Both Bun and the browser ship native Web Crypto AES-GCM, so the
 *     wire format is portable across the future "client-side wrap"
 *     scenario without bundling extra crypto deps.
 *   - The encryption-vault rows live behind row-level security and
 *     are never exposed; the threat model here is "what if an
 *     attacker dumps the auth DB?", which AES-GCM-256 with a 256-bit
 *     KEK fully addresses.
 *
 * Future migration to KMS / Vault:
 *   The KEK loader is a single function. When we move to AWS KMS or
 *   Hashicorp Vault, only `loadKek()` changes. The `wrapMasterKey` /
 *   `unwrapMasterKey` callers stay identical, and the wrapped_mk
 *   column gets a new `kek_id` value to mark which KEK produced it.
 */

import { logger } from '@mana/shared-hono';

const KEK_LENGTH_BYTES = 32; // AES-256
const IV_LENGTH_BYTES = 12; // AES-GCM standard
const MK_LENGTH_BYTES = 32; // user master key is also AES-256

let _kek: CryptoKey | null = null;
let _kekId: string | null = null;

/**
 * Loads the KEK from a base64 string and prepares it for use as an
 * AES-GCM key. Idempotent: subsequent calls with the same string are
 * no-ops. Throws if the input is not exactly 32 bytes after decoding.
 *
 * Call this once at boot from `index.ts` after `loadConfig()` has run.
 */
export async function loadKek(base64: string): Promise<void> {
	if (_kek) return;

	const raw = base64ToBytes(base64);
	if (raw.length !== KEK_LENGTH_BYTES) {
		throw new Error(
			`mana-auth/kek: expected ${KEK_LENGTH_BYTES} bytes after base64 decode, got ${raw.length}. ` +
				'Generate a fresh key with `openssl rand -base64 32`.'
		);
	}

	// Loud warning if the dev fallback KEK (32 zero bytes) is in use —
	// catches accidental production deploys without a real secret.
	if (raw.every((b) => b === 0)) {
		logger.warn('mana-auth: USING DEV KEK (32 zero bytes). Set MANA_AUTH_KEK before production.');
	}

	_kek = await crypto.subtle.importKey(
		'raw',
		toBufferSource(raw),
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	);

	// kek_id format lets us distinguish env-loaded keys from future
	// KMS-loaded ones at unwrap time. The `v1` suffix gives us a path
	// for in-place rotation: a new KEK gets `env-v2`, old vault rows
	// keep working until a background rotator re-wraps them.
	_kekId = 'env-v1';
}

/** Returns the kek_id stamp written to encryption_vaults.kek_id. */
export function activeKekId(): string {
	if (!_kekId) throw new Error('mana-auth/kek: loadKek() not called yet');
	return _kekId;
}

/**
 * Wraps a 32-byte master key with the KEK. Returns the base64 IV and
 * base64 ciphertext (which includes the 16-byte AES-GCM auth tag at
 * the tail). Both pieces are written to `encryption_vaults`.
 */
export async function wrapMasterKey(
	mkBytes: Uint8Array
): Promise<{ wrappedMk: string; wrapIv: string }> {
	if (mkBytes.length !== MK_LENGTH_BYTES) {
		throw new Error(
			`mana-auth/kek: expected ${MK_LENGTH_BYTES}-byte master key, got ${mkBytes.length}`
		);
	}
	const kek = requireKek();
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
	const ct = await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv: toBufferSource(iv) },
		kek,
		toBufferSource(mkBytes)
	);
	return {
		wrappedMk: bytesToBase64(new Uint8Array(ct)),
		wrapIv: bytesToBase64(iv),
	};
}

/**
 * Unwraps a stored master key. Returns the raw 32 bytes ready to be
 * sent to the client (over HTTPS) and re-imported as a CryptoKey by
 * the browser.
 *
 * Throws on tampered ciphertext (auth tag mismatch), wrong IV length,
 * wrong KEK, or any AES-GCM failure. The caller (vault service)
 * surfaces these as 500s and writes a `failed_fetch` audit row.
 */
export async function unwrapMasterKey(wrappedMk: string, wrapIv: string): Promise<Uint8Array> {
	const kek = requireKek();
	const iv = base64ToBytes(wrapIv);
	if (iv.length !== IV_LENGTH_BYTES) {
		throw new Error(`mana-auth/kek: expected ${IV_LENGTH_BYTES}-byte IV, got ${iv.length}`);
	}
	const ct = base64ToBytes(wrappedMk);
	const plain = await crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv: toBufferSource(iv) },
		kek,
		toBufferSource(ct)
	);
	const out = new Uint8Array(plain);
	if (out.length !== MK_LENGTH_BYTES) {
		throw new Error(
			`mana-auth/kek: unwrapped key has wrong length ${out.length} (expected ${MK_LENGTH_BYTES})`
		);
	}
	return out;
}

/**
 * Generates a fresh 32-byte master key. Used by the vault service at
 * vault initialisation time and during rotation.
 */
export function generateMasterKey(): Uint8Array {
	return crypto.getRandomValues(new Uint8Array(MK_LENGTH_BYTES));
}

// ─── Internals ────────────────────────────────────────────────

function requireKek(): CryptoKey {
	if (!_kek) {
		throw new Error('mana-auth/kek: loadKek() must be called before any wrap/unwrap operation');
	}
	return _kek;
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

/** TS 5.7 compat — Uint8Array<ArrayBufferLike> isn't assignable to BufferSource. */
function toBufferSource(bytes: Uint8Array): ArrayBuffer {
	const buf = new ArrayBuffer(bytes.length);
	new Uint8Array(buf).set(bytes);
	return buf;
}

// Test-only reset hook so vitest can reload the KEK between tests
// without re-running the whole module. Not exported from any barrel.
export function _resetForTesting(): void {
	_kek = null;
	_kekId = null;
}
