/**
 * Unwrap-grant round-trip test. Generates a fresh RSA keypair, uses the
 * public half to wrap an MDK via the same shape mana-auth uses, then
 * unwraps with the private half and verifies the MDK decrypts what the
 * MDK-derived AES-GCM key encrypted.
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import {
	deriveMissionDataKeyRaw,
	GRANT_DERIVATION_VERSION,
	type GrantDerivation,
	type MissionGrant,
} from '@mana/shared-ai';
import { configureMissionGrantKey, unwrapMissionGrant, _resetForTesting } from './unwrap-grant';

const fixedMasterKey = new Uint8Array(32).map((_, i) => i + 1);

async function genKeypair() {
	const kp = await crypto.subtle.generateKey(
		{
			name: 'RSA-OAEP',
			modulusLength: 2048,
			publicExponent: new Uint8Array([1, 0, 1]),
			hash: 'SHA-256',
		},
		true,
		['encrypt', 'decrypt']
	);
	const spki = new Uint8Array(await crypto.subtle.exportKey('spki', kp.publicKey));
	const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', kp.privateKey));
	return {
		publicKey: kp.publicKey,
		privatePem: toPem(pkcs8, 'PRIVATE KEY'),
		publicPem: toPem(spki, 'PUBLIC KEY'),
	};
}

function toPem(der: Uint8Array, label: string): string {
	const b64 = bytesToBase64(der);
	const body: string[] = [];
	for (let i = 0; i < b64.length; i += 64) body.push(b64.slice(i, i + 64));
	return `-----BEGIN ${label}-----\n${body.join('\n')}\n-----END ${label}-----`;
}

function derivation(): GrantDerivation {
	return {
		version: GRANT_DERIVATION_VERSION,
		missionId: 'mission-abc',
		tables: ['notes'],
		recordIds: ['notes:n1'],
	};
}

async function mintGrant(publicKey: CryptoKey, ttlMs = 60_000): Promise<MissionGrant> {
	const mdk = await deriveMissionDataKeyRaw(new Uint8Array(fixedMasterKey), derivation());
	const wrapped = new Uint8Array(
		await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, toBufferSource(mdk))
	);
	const now = Date.now();
	return {
		wrappedKey: bytesToBase64(wrapped),
		derivation: derivation(),
		issuedAt: new Date(now).toISOString(),
		expiresAt: new Date(now + ttlMs).toISOString(),
	};
}

beforeEach(() => {
	_resetForTesting();
});

describe('unwrapMissionGrant', () => {
	it('round-trips a freshly minted grant into a usable AES-GCM key', async () => {
		const { publicKey, privatePem } = await genKeypair();
		configureMissionGrantKey(privatePem);
		const grant = await mintGrant(publicKey);

		const result = await unwrapMissionGrant(grant);
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		// The unwrapped CryptoKey must decrypt what the same-derivation
		// MDK encrypted. Derive MDK separately, import as AES-GCM for
		// encrypt, encrypt a known plaintext, then decrypt with the
		// unwrapped key.
		const mdkRaw = await deriveMissionDataKeyRaw(new Uint8Array(fixedMasterKey), grant.derivation);
		const encKey = await crypto.subtle.importKey(
			'raw',
			toBufferSource(mdkRaw),
			{ name: 'AES-GCM' },
			false,
			['encrypt']
		);
		const iv = crypto.getRandomValues(new Uint8Array(12));
		const plaintext = new TextEncoder().encode('hello mission');
		const ct = await crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv: toBufferSource(iv) },
			encKey,
			toBufferSource(plaintext)
		);

		const dec = await crypto.subtle.decrypt(
			{ name: 'AES-GCM', iv: toBufferSource(iv) },
			result.mdk,
			ct
		);
		expect(new TextDecoder().decode(dec)).toBe('hello mission');
	});

	it('returns not-configured when key was never set', async () => {
		// no configureMissionGrantKey call
		const { publicKey } = await genKeypair();
		const grant = await mintGrant(publicKey);
		const result = await unwrapMissionGrant(grant);
		expect(result).toEqual({ ok: false, reason: 'not-configured' });
	});

	it('returns not-configured when key is explicitly unset', async () => {
		const { publicKey } = await genKeypair();
		configureMissionGrantKey(undefined);
		const grant = await mintGrant(publicKey);
		const result = await unwrapMissionGrant(grant);
		expect(result).toEqual({ ok: false, reason: 'not-configured' });
	});

	it('returns expired for past expiresAt', async () => {
		const { publicKey, privatePem } = await genKeypair();
		configureMissionGrantKey(privatePem);
		const grant = await mintGrant(publicKey, -1000);
		const result = await unwrapMissionGrant(grant);
		expect(result).toEqual({ ok: false, reason: 'expired' });
	});

	it('returns wrap-rejected for a wrapped key encrypted with the wrong pubkey', async () => {
		const { privatePem } = await genKeypair();
		const { publicKey: otherPub } = await genKeypair();
		configureMissionGrantKey(privatePem);
		const grant = await mintGrant(otherPub);
		const result = await unwrapMissionGrant(grant);
		expect(result).toEqual({ ok: false, reason: 'wrap-rejected' });
	});
});

function bytesToBase64(bytes: Uint8Array): string {
	let bin = '';
	for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
	return btoa(bin);
}

function toBufferSource(bytes: Uint8Array): ArrayBuffer {
	const buf = new ArrayBuffer(bytes.length);
	new Uint8Array(buf).set(bytes);
	return buf;
}
