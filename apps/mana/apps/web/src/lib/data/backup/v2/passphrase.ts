/**
 * Passphrase-based wrap/unwrap for `.mana` v2 archives.
 *
 * Design:
 *   - KDF: PBKDF2-HMAC-SHA256, 600k iterations (OWASP 2023 guidance).
 *   - AEAD: AES-GCM-256 (Web Crypto native, same primitive as the
 *     per-field vault crypto).
 *   - 16-byte random salt per archive, 12-byte random IV per archive
 *     (GCM standard).
 *   - SHA-256 of the plaintext body goes into the manifest so a
 *     wrong-passphrase failure is distinguishable from file corruption:
 *       * AEAD auth-tag mismatch → "that passphrase doesn't open this"
 *       * AEAD OK but sha256 mismatch → "archive is corrupted"
 *
 * We use Web Crypto exclusively — no argon2-browser / scrypt-js deps.
 * If Argon2id is desired later it's an additive manifest field:
 *   manifest.passphrase.kdf === 'Argon2id-v1.3' → new code path.
 *
 * Memory: the whole body sits in memory during wrap/unwrap. For a 20 MB
 * snapshot that's fine; if we ever ship GB-class datasets we'd stream,
 * but Web Crypto's one-shot encrypt API would have to grow along with it.
 */

import { sha256Hex, type PassphraseWrap } from './format';

export const KDF_ITERATIONS = 600_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;

export interface SealResult {
	sealed: Uint8Array;
	wrap: PassphraseWrap;
}

/**
 * Encrypt `plaintextBody` under a key derived from `passphrase`. Returns
 * the ciphertext and the manifest `passphrase` block the caller should
 * stamp onto the BackupManifestV2.
 */
export async function seal(passphrase: string, plaintextBody: Uint8Array): Promise<SealResult> {
	if (!passphrase) throw new PassphraseError('passphrase must not be empty');

	const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
	const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
	const key = await deriveKey(passphrase, salt, KDF_ITERATIONS);
	const plaintextSha256 = await sha256Hex(plaintextBody);

	const copy = new Uint8Array(plaintextBody.byteLength);
	copy.set(plaintextBody);
	const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: toBuffer(iv) }, key, copy.buffer);

	return {
		sealed: new Uint8Array(ct),
		wrap: {
			kdf: 'PBKDF2-SHA256',
			kdfIterations: KDF_ITERATIONS,
			kdfSaltBase64: bytesToBase64Url(salt),
			cipher: 'AES-GCM-256',
			ivBase64: bytesToBase64Url(iv),
			plaintextSha256,
		},
	};
}

/**
 * Decrypt a sealed body. Throws one of two specific errors:
 *   - `PassphraseError`: wrong passphrase (AEAD tag mismatch) OR the
 *     recovered body's sha256 doesn't match the manifest
 *   - regular Error: malformed wrap metadata (invalid base64 etc.)
 */
export async function unseal(
	passphrase: string,
	sealed: Uint8Array,
	wrap: PassphraseWrap
): Promise<Uint8Array> {
	if (!passphrase) throw new PassphraseError('passphrase must not be empty');
	if (wrap.kdf !== 'PBKDF2-SHA256') {
		throw new Error(`unsupported KDF "${wrap.kdf}"`);
	}
	if (wrap.cipher !== 'AES-GCM-256') {
		throw new Error(`unsupported cipher "${wrap.cipher}"`);
	}

	const salt = base64UrlToBytes(wrap.kdfSaltBase64);
	const iv = base64UrlToBytes(wrap.ivBase64);
	const key = await deriveKey(passphrase, salt, wrap.kdfIterations);

	let plaintextBuf: ArrayBuffer;
	try {
		const copy = new Uint8Array(sealed.byteLength);
		copy.set(sealed);
		plaintextBuf = await crypto.subtle.decrypt(
			{ name: 'AES-GCM', iv: toBuffer(iv) },
			key,
			copy.buffer
		);
	} catch {
		// AES-GCM auth-tag failure. Most likely the user typed the wrong
		// passphrase. We don't leak any ciphertext info.
		throw new PassphraseError('wrong passphrase');
	}

	const plaintext = new Uint8Array(plaintextBuf);
	const actualSha = await sha256Hex(plaintext);
	if (actualSha !== wrap.plaintextSha256) {
		throw new PassphraseError('archive integrity check failed after decrypt — file is corrupted');
	}
	return plaintext;
}

export class PassphraseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'PassphraseError';
	}
}

// ─── Internals ───────────────────────────────────────────────────

async function deriveKey(
	passphrase: string,
	salt: Uint8Array,
	iterations: number
): Promise<CryptoKey> {
	const passphraseBytes = new TextEncoder().encode(passphrase);
	const baseKey = await crypto.subtle.importKey('raw', toBuffer(passphraseBytes), 'PBKDF2', false, [
		'deriveKey',
	]);
	return crypto.subtle.deriveKey(
		{
			name: 'PBKDF2',
			salt: toBuffer(salt),
			iterations,
			hash: 'SHA-256',
		},
		baseKey,
		{ name: 'AES-GCM', length: 256 },
		false,
		['encrypt', 'decrypt']
	);
}

function toBuffer(bytes: Uint8Array): ArrayBuffer {
	// Make a fresh ArrayBuffer — the DOM typings refuse SharedArrayBuffer-
	// backed views even though Web Crypto accepts them at runtime.
	const copy = new Uint8Array(bytes.byteLength);
	copy.set(bytes);
	return copy.buffer;
}

// Base64-URL: fits cleanly into JSON manifests, no padding, no +/ conflicts.

function bytesToBase64Url(bytes: Uint8Array): string {
	let binary = '';
	for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(b64url: string): Uint8Array {
	const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
	const padded = b64 + '==='.slice((b64.length + 3) % 4);
	const binary = atob(padded);
	const out = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
	return out;
}
