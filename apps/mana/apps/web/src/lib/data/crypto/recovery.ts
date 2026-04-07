/**
 * Recovery code primitives for the zero-knowledge opt-in (Phase 9).
 *
 * The recovery code is a user-held 256-bit secret that wraps the master
 * key as an alternative to the server-side KEK wrap. When a user opts
 * into zero-knowledge mode:
 *
 *   1. Client generates a 32-byte recovery secret
 *   2. Client derives an AES-GCM-256 wrap key from it via HKDF-SHA256
 *   3. Client wraps the existing master key with the recovery key
 *   4. The wrapped MK + IV are sent to the server (the recovery secret
 *      itself NEVER leaves the device)
 *   5. The user copies the formatted recovery code to a password manager
 *   6. The user toggles zero-knowledge mode on; the server then refuses
 *      to release the KEK-wrapped MK and instead returns the recovery-
 *      wrapped blob, which the client unwraps with the freshly-pasted
 *      recovery code on the next unlock
 *
 * Why hex over BIP-39?
 *   - No 2048-word wordlist to bundle (~17 KB even gzipped)
 *   - 32 random bytes have a full 256 bits of entropy on their own —
 *     no checksum word needed because there's nothing to "validate";
 *     either the unwrap succeeds or it doesn't
 *   - Trivially copy-pasteable into any password manager, no language
 *     dependency, no autocomplete-confusing dictionary words
 *   - Slightly longer than 24 BIP-39 words (64 vs ~150 chars formatted)
 *     but no spaces, so it survives autocorrect
 *
 * Format:
 *   16 groups of 4 hex chars separated by dashes:
 *     `1A2B-3C4D-5E6F-...` (79 chars total: 64 hex + 15 dashes)
 *   The dash separator is purely cosmetic — `parseRecoveryCode` strips
 *   any whitespace and any dashes before validating, so users can paste
 *   any reasonable formatting.
 *
 * Why HKDF instead of PBKDF2/scrypt?
 *   - The recovery code already has 256 bits of entropy; brute-forcing
 *     a single AES-GCM unwrap is computationally infeasible regardless
 *     of how slow the KDF is
 *   - HKDF is the lighter primitive when the input is high-entropy
 *     (RFC 5869 was designed for exactly this case)
 *   - Web Crypto ships HKDF natively — no third-party crypto deps
 *
 * The salt is empty by design (high-entropy input) and the info string
 * (`mana-recovery-v1`) gives us a versioned derivation path for any
 * future format migration.
 */

import { importMasterKey, exportMasterKey } from './aes';

/** Length of the raw recovery secret in bytes — 256 bits of entropy. */
export const RECOVERY_SECRET_BYTES = 32;

/** Number of hex chars per visual group in the formatted code. */
const GROUP_SIZE = 4;

/** Dash-separated hex groups that make up the displayed recovery code. */
const TOTAL_GROUPS = (RECOVERY_SECRET_BYTES * 2) / GROUP_SIZE; // 16

/** HKDF info string. Bumped if the derivation ever changes. */
const HKDF_INFO = 'mana-recovery-v1';

// ─── Generation + formatting ────────────────────────────────────

/**
 * Generates a fresh 32-byte recovery secret using the Web Crypto CSPRNG.
 * This is the raw key material; the caller usually wants to round-trip
 * it through `formatRecoveryCode` before showing it to a human.
 */
export function generateRecoverySecret(): Uint8Array {
	return crypto.getRandomValues(new Uint8Array(RECOVERY_SECRET_BYTES));
}

/**
 * Formats raw recovery bytes as a copy-pasteable string of 16 dash-
 * separated hex groups: `1A2B-3C4D-5E6F-...`. Uppercase hex by
 * convention (easier to read on a printout, parser is case-insensitive).
 */
export function formatRecoveryCode(raw: Uint8Array): string {
	if (raw.length !== RECOVERY_SECRET_BYTES) {
		throw new Error(
			`mana-crypto/recovery: expected ${RECOVERY_SECRET_BYTES} raw bytes, got ${raw.length}`
		);
	}
	const hex = bytesToHex(raw).toUpperCase();
	const groups: string[] = [];
	for (let i = 0; i < TOTAL_GROUPS; i++) {
		groups.push(hex.slice(i * GROUP_SIZE, (i + 1) * GROUP_SIZE));
	}
	return groups.join('-');
}

/**
 * Parses a user-typed (or password-manager-pasted) recovery code back
 * into the raw 32 bytes. Tolerant of:
 *   - Any case (mixed/upper/lower)
 *   - Extra whitespace anywhere
 *   - Missing or extra dashes
 *   - Common confusables (none replaced for now — hex is unambiguous)
 *
 * Throws on:
 *   - Wrong length after stripping separators
 *   - Non-hex characters
 *
 * Failures are intentionally generic — the UI shouldn't tell an
 * attacker which character was wrong.
 */
export function parseRecoveryCode(code: string): Uint8Array {
	const cleaned = code.replace(/[\s-]/g, '');
	if (cleaned.length !== RECOVERY_SECRET_BYTES * 2) {
		throw new RecoveryCodeFormatError(
			`expected ${RECOVERY_SECRET_BYTES * 2} hex chars after stripping separators, got ${cleaned.length}`
		);
	}
	if (!/^[0-9a-fA-F]+$/.test(cleaned)) {
		throw new RecoveryCodeFormatError('contains non-hex characters');
	}
	return hexToBytes(cleaned);
}

/**
 * Thrown by `parseRecoveryCode` when the input is not a valid recovery
 * code shape. Distinct from a wrap/unwrap failure (which means the code
 * is well-formed but didn't match) so the UI can give the user a more
 * specific hint when the format is just off.
 */
export class RecoveryCodeFormatError extends Error {
	constructor(detail: string) {
		super(`mana-crypto/recovery: malformed recovery code (${detail})`);
		this.name = 'RecoveryCodeFormatError';
	}
}

// ─── Key derivation + wrap/unwrap ───────────────────────────────

/**
 * Derives the AES-GCM-256 wrap key from the raw recovery secret via
 * HKDF-SHA256. Returns a non-extractable CryptoKey ready for use with
 * `wrapMasterKeyWithRecovery` / `unwrapMasterKeyWithRecovery`.
 *
 * Empty salt + the versioned `mana-recovery-v1` info string. The
 * derived key is non-extractable so even if a malicious script gets a
 * reference to it, it can't be exfiltrated as raw bytes.
 */
export async function deriveRecoveryWrapKey(rawSecret: Uint8Array): Promise<CryptoKey> {
	if (rawSecret.length !== RECOVERY_SECRET_BYTES) {
		throw new Error(
			`mana-crypto/recovery: expected ${RECOVERY_SECRET_BYTES}-byte secret, got ${rawSecret.length}`
		);
	}

	// Import the raw bytes as HKDF input keying material.
	const ikm = await crypto.subtle.importKey(
		'raw',
		toBufferSource(rawSecret),
		'HKDF',
		false, // never extractable
		['deriveKey']
	);

	// Derive the AES-GCM wrap key. salt:empty because the input already
	// has full 256-bit entropy; info:mana-recovery-v1 versions the derivation.
	return crypto.subtle.deriveKey(
		{
			name: 'HKDF',
			hash: 'SHA-256',
			salt: new Uint8Array(0),
			info: new TextEncoder().encode(HKDF_INFO),
		},
		ikm,
		{ name: 'AES-GCM', length: 256 },
		false, // non-extractable
		['encrypt', 'decrypt']
	);
}

/**
 * Wraps a master key (as a CryptoKey) with the recovery wrap key.
 * Returns base64-encoded ciphertext + IV ready to be sent to the
 * server. The MK must be extractable (the only way to encrypt it as
 * a blob is to read its raw bytes first).
 *
 * Throws if the master key is non-extractable — the caller must use
 * `generateMasterKey(true)` or import via a path that preserved
 * extractability if it wants to seal a key for recovery.
 */
export async function wrapMasterKeyWithRecovery(
	masterKey: CryptoKey,
	recoveryWrapKey: CryptoKey
): Promise<{ recoveryWrappedMk: string; recoveryIv: string }> {
	const rawMk = await exportMasterKey(masterKey);
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const ct = await crypto.subtle.encrypt(
		{ name: 'AES-GCM', iv: toBufferSource(iv) },
		recoveryWrapKey,
		toBufferSource(rawMk)
	);
	// Best-effort wipe of the raw MK reference once it's sealed.
	rawMk.fill(0);
	return {
		recoveryWrappedMk: bytesToBase64(new Uint8Array(ct)),
		recoveryIv: bytesToBase64(iv),
	};
}

/**
 * Unwraps a recovery-wrapped master key blob back into a usable
 * non-extractable CryptoKey. The returned key is suitable for direct
 * use with the existing wrapValue/unwrapValue helpers.
 *
 * Throws on:
 *   - Wrong recovery code (AES-GCM auth tag mismatch)
 *   - Tampered ciphertext
 *   - Malformed base64
 *
 * The caller is expected to surface these uniformly as "wrong recovery
 * code" — leaking which check failed gives an attacker free signal.
 */
export async function unwrapMasterKeyWithRecovery(
	recoveryWrappedMk: string,
	recoveryIv: string,
	recoveryWrapKey: CryptoKey
): Promise<CryptoKey> {
	const iv = base64ToBytes(recoveryIv);
	const ct = base64ToBytes(recoveryWrappedMk);
	const plain = await crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv: toBufferSource(iv) },
		recoveryWrapKey,
		toBufferSource(ct)
	);
	const rawMk = new Uint8Array(plain);
	if (rawMk.length !== 32) {
		throw new Error(`mana-crypto/recovery: unwrapped master key has wrong length ${rawMk.length}`);
	}
	const cryptoKey = await importMasterKey(rawMk);
	rawMk.fill(0);
	return cryptoKey;
}

// ─── Internal helpers ───────────────────────────────────────────

function bytesToHex(bytes: Uint8Array): string {
	let out = '';
	for (let i = 0; i < bytes.length; i++) {
		out += bytes[i].toString(16).padStart(2, '0');
	}
	return out;
}

function hexToBytes(hex: string): Uint8Array {
	const out = new Uint8Array(hex.length / 2);
	for (let i = 0; i < out.length; i++) {
		out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
	}
	return out;
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

/** TS 5.7 BufferSource compat — see comment in aes.ts. */
function toBufferSource(bytes: Uint8Array): ArrayBuffer {
	const buf = new ArrayBuffer(bytes.length);
	new Uint8Array(buf).set(bytes);
	return buf;
}
