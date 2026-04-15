import { describe, it, expect, vi } from 'vitest';
import {
	requestMissionGrant,
	ZeroKnowledgeGrantError,
	GrantNotConfiguredError,
	VaultNotInitialisedError,
} from './grant-client';

function mockFetch(status: number, body: unknown): typeof fetch {
	return vi.fn(async () => ({
		ok: status >= 200 && status < 300,
		status,
		statusText: 'stub',
		json: async () => body,
	})) as unknown as typeof fetch;
}

const opts = {
	authUrl: 'https://auth.test',
	getToken: () => 'tok',
};

const input = {
	missionId: 'm1',
	tables: ['notes'],
	recordIds: ['notes:n1'],
};

describe('requestMissionGrant', () => {
	it('returns the grant on 200', async () => {
		const grant = {
			wrappedKey: 'wk',
			derivation: { version: 'v1', missionId: 'm1', tables: ['notes'], recordIds: ['notes:n1'] },
			issuedAt: '2026-04-15T00:00:00.000Z',
			expiresAt: '2026-04-22T00:00:00.000Z',
		};
		globalThis.fetch = mockFetch(200, grant);
		expect(await requestMissionGrant(opts, input)).toEqual(grant);
	});

	it('throws ZeroKnowledgeGrantError on 409 ZK_ACTIVE', async () => {
		globalThis.fetch = mockFetch(409, { code: 'ZK_ACTIVE', error: 'zk' });
		await expect(requestMissionGrant(opts, input)).rejects.toBeInstanceOf(ZeroKnowledgeGrantError);
	});

	it('throws GrantNotConfiguredError on 503 GRANT_NOT_CONFIGURED', async () => {
		globalThis.fetch = mockFetch(503, { code: 'GRANT_NOT_CONFIGURED' });
		await expect(requestMissionGrant(opts, input)).rejects.toBeInstanceOf(GrantNotConfiguredError);
	});

	it('throws VaultNotInitialisedError on 404 VAULT_NOT_INITIALISED', async () => {
		globalThis.fetch = mockFetch(404, { code: 'VAULT_NOT_INITIALISED' });
		await expect(requestMissionGrant(opts, input)).rejects.toBeInstanceOf(VaultNotInitialisedError);
	});

	it('throws a generic Error with status for unrecognised failures', async () => {
		globalThis.fetch = mockFetch(400, { code: 'BAD_REQUEST', error: 'missionId required' });
		await expect(requestMissionGrant(opts, input)).rejects.toThrow(
			/requestMissionGrant failed: 400 missionId required/
		);
	});

	it('refuses to call without a token', async () => {
		globalThis.fetch = mockFetch(200, {});
		await expect(requestMissionGrant({ ...opts, getToken: () => null }, input)).rejects.toThrow(
			/no auth token/
		);
	});
});
