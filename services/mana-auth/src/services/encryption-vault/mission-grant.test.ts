/**
 * MissionGrantService unit tests.
 *
 * Crypto-only — stubs the EncryptionVaultService so we don't need a
 * real Postgres. Generates a fresh RSA-OAEP-2048 keypair per-test,
 * exports the public key as SPKI PEM, feeds it into the service, then
 * unwraps the returned grant with the private key and checks it matches
 * the expected HKDF output.
 */

import { describe, it, expect } from 'bun:test';
import { deriveMissionDataKeyRaw, GRANT_DERIVATION_VERSION } from '@mana/shared-ai';
import {
	MissionGrantService,
	MissionGrantNotConfigured,
	ZeroKnowledgeGrantForbidden,
} from './mission-grant';
import type { EncryptionVaultService, VaultFetchResult } from './index';

const fixedMasterKey = new Uint8Array(32).map((_, i) => i + 1);

/** The service zero-fills the returned masterKey after use, so each
 *  getMasterKey() call must return a fresh copy — otherwise a second
 *  call in the same test would derive from all-zero bytes. */
function stubVault(result: VaultFetchResult): EncryptionVaultService {
	return {
		getMasterKey: async () => ({
			...result,
			masterKey: result.masterKey ? new Uint8Array(result.masterKey) : null,
		}),
	} as unknown as EncryptionVaultService;
}

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
	const pem =
		'-----BEGIN PUBLIC KEY-----\n' +
		chunk(bytesToBase64(spki), 64).join('\n') +
		'\n-----END PUBLIC KEY-----';
	return { pem, privateKey: kp.privateKey };
}

describe('MissionGrantService', () => {
	it('mints a grant whose wrappedKey unwraps to the derived MDK', async () => {
		const { pem, privateKey } = await genKeypair();
		const service = new MissionGrantService(
			stubVault({ masterKey: new Uint8Array(fixedMasterKey), formatVersion: 1, kekId: 'env-v1' }),
			pem
		);

		const grant = await service.createGrant('user-1', {
			missionId: 'mission-abc',
			tables: ['notes', 'tasks'],
			recordIds: ['notes:n1', 'tasks:t1'],
		});

		expect(grant.derivation.version).toBe(GRANT_DERIVATION_VERSION);
		expect(grant.derivation.missionId).toBe('mission-abc');
		expect(grant.derivation.tables).toEqual(['notes', 'tasks']);
		expect(grant.derivation.recordIds).toEqual(['notes:n1', 'tasks:t1']);

		const wrappedBytes = base64ToBytes(grant.wrappedKey);
		const plain = new Uint8Array(
			await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, toBufferSource(wrappedBytes))
		);

		const expectedMdk = await deriveMissionDataKeyRaw(
			new Uint8Array(fixedMasterKey),
			grant.derivation
		);
		expect(Array.from(plain)).toEqual(Array.from(expectedMdk));
	});

	it('sorts tables and recordIds before binding into the key', async () => {
		const { pem, privateKey } = await genKeypair();
		const service = new MissionGrantService(
			stubVault({ masterKey: new Uint8Array(fixedMasterKey), formatVersion: 1, kekId: 'env-v1' }),
			pem
		);

		const a = await service.createGrant('u', {
			missionId: 'm',
			tables: ['tasks', 'notes'],
			recordIds: ['tasks:t1', 'notes:n1'],
		});
		const b = await service.createGrant('u', {
			missionId: 'm',
			tables: ['notes', 'tasks'],
			recordIds: ['notes:n1', 'tasks:t1'],
		});

		const keyA = new Uint8Array(
			await crypto.subtle.decrypt(
				{ name: 'RSA-OAEP' },
				privateKey,
				toBufferSource(base64ToBytes(a.wrappedKey))
			)
		);
		const keyB = new Uint8Array(
			await crypto.subtle.decrypt(
				{ name: 'RSA-OAEP' },
				privateKey,
				toBufferSource(base64ToBytes(b.wrappedKey))
			)
		);
		expect(Array.from(keyA)).toEqual(Array.from(keyB));
	});

	it('rejects zero-knowledge users', async () => {
		const { pem } = await genKeypair();
		const service = new MissionGrantService(
			stubVault({
				masterKey: null,
				formatVersion: 1,
				kekId: '',
				requiresRecoveryCode: true,
				recoveryWrappedMk: 'x',
				recoveryIv: 'y',
			}),
			pem
		);

		await expect(
			service.createGrant('u', { missionId: 'm', tables: ['notes'], recordIds: ['notes:n1'] })
		).rejects.toBeInstanceOf(ZeroKnowledgeGrantForbidden);
	});

	it('throws MissionGrantNotConfigured when no public key is set', async () => {
		const service = new MissionGrantService(
			stubVault({ masterKey: new Uint8Array(fixedMasterKey), formatVersion: 1, kekId: 'env-v1' }),
			undefined
		);

		await expect(
			service.createGrant('u', { missionId: 'm', tables: ['notes'], recordIds: ['notes:n1'] })
		).rejects.toBeInstanceOf(MissionGrantNotConfigured);
	});

	it('rejects missing tables / recordIds', async () => {
		const { pem } = await genKeypair();
		const service = new MissionGrantService(
			stubVault({ masterKey: new Uint8Array(fixedMasterKey), formatVersion: 1, kekId: 'env-v1' }),
			pem
		);

		await expect(
			service.createGrant('u', { missionId: 'm', tables: [], recordIds: ['a'] })
		).rejects.toThrow(/tables/);
		await expect(
			service.createGrant('u', { missionId: 'm', tables: ['notes'], recordIds: [] })
		).rejects.toThrow(/recordIds/);
	});

	it('clamps ttl to the upper bound', async () => {
		const { pem } = await genKeypair();
		const service = new MissionGrantService(
			stubVault({ masterKey: new Uint8Array(fixedMasterKey), formatVersion: 1, kekId: 'env-v1' }),
			pem
		);

		const grant = await service.createGrant('u', {
			missionId: 'm',
			tables: ['notes'],
			recordIds: ['notes:n1'],
			ttlMs: 365 * 24 * 60 * 60 * 1000, // 1 year → clamped to 30d
		});
		const ttlMs = new Date(grant.expiresAt).getTime() - new Date(grant.issuedAt).getTime();
		expect(ttlMs).toBe(30 * 24 * 60 * 60 * 1000);
	});
});

// ─── helpers ─────────────────────────────────────────────

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

function toBufferSource(bytes: Uint8Array): ArrayBuffer {
	const buf = new ArrayBuffer(bytes.length);
	new Uint8Array(buf).set(bytes);
	return buf;
}

function chunk(s: string, n: number): string[] {
	const out: string[] = [];
	for (let i = 0; i < s.length; i += n) out.push(s.slice(i, i + n));
	return out;
}
