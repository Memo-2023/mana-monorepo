/**
 * AES-GCM unwrap — server-side mirror of the webapp's `aes.ts#unwrapValue`.
 *
 * Same wire format:
 *   `enc:1:${base64(iv)}.${base64(ct)}`
 *
 * The webapp's pipeline JSON-stringifies every value before encryption, so
 * we JSON.parse after decryption and the type round-trips. Non-prefixed
 * values pass through unchanged, matching the webapp's "safe to apply
 * unconditionally" semantics.
 *
 * Throws on tampered ciphertext (AES-GCM auth tag mismatch), malformed
 * blobs, wrong key. The resolver catches and converts into audit rows.
 *
 * The companion `wrapValue` is intentionally NOT implemented here —
 * mana-ai never writes encrypted fields; it only reads them. Keeping the
 * surface read-only makes it obvious in review that this service cannot
 * corrupt user data cryptographically.
 */

const ENC_PREFIX = 'enc:1:';
const IV_LENGTH = 12;

export function isEncrypted(value: unknown): boolean {
	return typeof value === 'string' && value.startsWith(ENC_PREFIX);
}

/**
 * Decrypts a wire-format blob back to its original JSON value. For non-
 * encrypted inputs (null, non-strings, strings without the prefix) it
 * returns the value as-is. That way a resolver can apply it over every
 * field of a mixed-encryption record without a per-field check.
 */
export async function unwrapValue(blob: unknown, key: CryptoKey): Promise<unknown> {
	if (!isEncrypted(blob)) return blob;

	const body = (blob as string).slice(ENC_PREFIX.length);
	const dotIndex = body.indexOf('.');
	if (dotIndex === -1) {
		throw new Error('mana-ai/crypto: malformed encrypted blob (missing iv/ct separator)');
	}

	const iv = base64ToBytes(body.slice(0, dotIndex));
	const ct = base64ToBytes(body.slice(dotIndex + 1));

	if (iv.length !== IV_LENGTH) {
		throw new Error(`mana-ai/crypto: expected ${IV_LENGTH}-byte IV, got ${iv.length}`);
	}

	const plaintext = await crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv: toBufferSource(iv) },
		key,
		toBufferSource(ct)
	);

	return JSON.parse(new TextDecoder().decode(plaintext));
}

/**
 * Decrypts every enc:1:-prefixed string field on a record in place. Non-
 * prefixed fields are left alone. Returns the same record reference for
 * caller convenience.
 *
 * Counts how many fields were decrypted so the caller can decide whether
 * to write an audit row (zero-decrypt records don't need one — no secret
 * was touched). Failures bubble up; the caller is responsible for the
 * try/catch and audit bookkeeping.
 */
export async function decryptRecordFields(
	record: Record<string, unknown>,
	key: CryptoKey
): Promise<{ record: Record<string, unknown>; decryptedFields: string[] }> {
	const decryptedFields: string[] = [];
	for (const [k, v] of Object.entries(record)) {
		if (!isEncrypted(v)) continue;
		record[k] = await unwrapValue(v, key);
		decryptedFields.push(k);
	}
	return { record, decryptedFields };
}

// ─── Helpers ─────────────────────────────────────────────────

function base64ToBytes(b64: string): Uint8Array {
	const bin = atob(b64);
	const out = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
	return out;
}

function toBufferSource(bytes: Uint8Array): ArrayBuffer {
	const buf = new ArrayBuffer(bytes.length);
	new Uint8Array(buf).set(bytes);
	return buf;
}
