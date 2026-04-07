/**
 * AES-GCM-256 wrap/unwrap primitives.
 *
 * Pure crypto layer with no state and no Dexie dependency. The higher-level
 * registry/key-provider modules use these to encrypt configured fields on
 * the way into IndexedDB and decrypt them on the way out.
 *
 * Wire format
 *   `enc:${VERSION}:${base64(iv)}.${base64(ct)}`
 *
 * The string-prefix format (rather than a JSON envelope) is deliberate:
 *   - One scan to detect "is this encrypted?" — `value.startsWith('enc:1:')`
 *   - Survives JSON.stringify when records flow through the sync wire
 *   - Compact: ~1.4× the original byte length, vs ~2× for a JSON envelope
 *   - Trivial to bump VERSION for future format migrations
 *
 * Authenticated encryption: AES-GCM provides both confidentiality and
 * tamper-detection. A modified ciphertext fails decryption with an
 * OperationError instead of returning silent garbage — `unwrapValue`
 * surfaces that as a thrown error so callers can react.
 *
 * Value types: anything JSON-serialisable. The plaintext is JSON.stringified
 * before encryption, JSON.parsed after decryption. `null` and `undefined`
 * pass through unchanged so callers can blindly wrap optional fields
 * without checking each one first.
 */

/** Bumped if the wire format ever changes. Old blobs stay readable as long
 * as `unwrapValue` knows how to handle their version prefix. */
export const ENCRYPTION_VERSION = 1;

/** All encrypted blobs start with this exact prefix — used by `isEncrypted`. */
export const ENC_PREFIX = `enc:${ENCRYPTION_VERSION}:`;

/** AES-GCM standard IV length is 96 bits (12 bytes). Larger IVs are not
 * recommended by NIST and would only burn entropy. */
const IV_LENGTH = 12;

// ─── Base64 helpers ───────────────────────────────────────────
//
// We avoid `btoa(String.fromCharCode(...bytes))` because the spread operator
// hits the JS argument limit (~65k) for large records. The manual loop is
// O(n) and works for any size.

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

/**
 * TypeScript 5.7+ parameterised Uint8Array with the underlying buffer
 * type, which now includes SharedArrayBuffer. Web Crypto's `BufferSource`
 * type still expects a plain ArrayBuffer-backed view, so we need to copy
 * the bytes through a fresh ArrayBuffer to satisfy the strict type check.
 *
 * This is a TypeScript-only annoyance — at runtime the call would have
 * worked fine with the original Uint8Array. The copy is O(n) and
 * negligible for the field sizes we encrypt (< 100 KB typical).
 */
function toBufferSource(bytes: Uint8Array): ArrayBuffer {
	const buf = new ArrayBuffer(bytes.length);
	new Uint8Array(buf).set(bytes);
	return buf;
}

// ─── Public API ───────────────────────────────────────────────

/**
 * Returns true iff `value` is a string carrying the encryption prefix.
 *
 * Cheap synchronous detection — no decryption attempted. Use this to
 * decide whether a field needs to be unwrapped on read, or whether a
 * value coming back from a backend pull is already encrypted.
 */
export function isEncrypted(value: unknown): boolean {
	return typeof value === 'string' && value.startsWith(ENC_PREFIX);
}

/**
 * Encrypts `value` with `key` and returns the wire-format string. Pass-
 * through for `null` / `undefined` so optional-field call sites stay
 * concise:
 *
 *   record.title = await wrapValue(record.title, key);
 *   record.notes = await wrapValue(record.notes, key); // safe even if null
 *
 * Throws if `key` is unusable (wrong algorithm, wrong usages). Each call
 * generates a fresh random IV — never reuse one for the same key.
 */
export async function wrapValue(value: unknown, key: CryptoKey): Promise<unknown> {
	if (value === null || value === undefined) return value;

	const json = JSON.stringify(value);
	const plaintext = new TextEncoder().encode(json);
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

	const ct = await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv: toBufferSource(iv) },
		key,
		toBufferSource(plaintext)
	);

	return ENC_PREFIX + bytesToBase64(iv) + '.' + bytesToBase64(new Uint8Array(ct));
}

/**
 * Decrypts a wire-format string back to its original JS value. Pass-
 * through for non-strings, `null`/`undefined`, and any string that
 * doesn't carry the encryption prefix — that way `unwrapValue` is safe
 * to apply unconditionally to mixed records.
 *
 * Throws on tampered ciphertext (AES-GCM auth tag mismatch), malformed
 * blobs, or wrong key. Callers should treat the throw as data corruption
 * — there's no soft-recovery path.
 */
export async function unwrapValue(blob: unknown, key: CryptoKey): Promise<unknown> {
	if (!isEncrypted(blob)) return blob;

	const body = (blob as string).slice(ENC_PREFIX.length);
	const dotIndex = body.indexOf('.');
	if (dotIndex === -1) {
		throw new Error('mana-crypto: malformed encrypted blob (missing iv/ct separator)');
	}

	const iv = base64ToBytes(body.slice(0, dotIndex));
	const ct = base64ToBytes(body.slice(dotIndex + 1));

	const plaintext = await crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv: toBufferSource(iv) },
		key,
		toBufferSource(ct)
	);

	const json = new TextDecoder().decode(plaintext);
	return JSON.parse(json);
}

/**
 * Generates a fresh AES-GCM-256 key. Used at vault initialisation time
 * (Phase 2: server-side; tests: in-memory) to mint the per-user master
 * key. The key is `extractable: true` so the server can wrap it with
 * the KEK before storing — set to `false` for client-side derived keys
 * that should never leave the browser.
 */
export async function generateMasterKey(extractable = true): Promise<CryptoKey> {
	return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, extractable, [
		'encrypt',
		'decrypt',
	]);
}

/**
 * Imports a raw 32-byte buffer as an AES-GCM-256 key. Used by the
 * Phase 3 client to take the bytes the vault endpoint returns and turn
 * them into a non-extractable CryptoKey instance for runtime use.
 */
export async function importMasterKey(rawBytes: Uint8Array): Promise<CryptoKey> {
	if (rawBytes.length !== 32) {
		throw new Error(`mana-crypto: expected 32-byte master key, got ${rawBytes.length}`);
	}
	return crypto.subtle.importKey(
		'raw',
		toBufferSource(rawBytes),
		{ name: 'AES-GCM', length: 256 },
		false, // non-extractable: once it's in the browser, it stays there
		['encrypt', 'decrypt']
	);
}

/**
 * Exports a key back to its raw 32 bytes. Only works on extractable
 * keys; non-extractable keys throw. Used by tests and the Phase 2
 * server-side wrap path.
 */
export async function exportMasterKey(key: CryptoKey): Promise<Uint8Array> {
	const raw = await crypto.subtle.exportKey('raw', key);
	return new Uint8Array(raw);
}
