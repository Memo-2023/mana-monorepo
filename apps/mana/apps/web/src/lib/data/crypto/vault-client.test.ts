/**
 * Tests for the browser-side vault client.
 *
 * Mocks `globalThis.fetch` to simulate the various HTTP responses
 * mana-auth can return. The actual MemoryKeyProvider gets a real
 * Web Crypto key imported via the response, so the test also
 * verifies that the import path doesn't blow up on the bytes the
 * server sends.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createVaultClient } from './vault-client';
import { MemoryKeyProvider, setKeyProvider, getActiveKey, isVaultUnlocked } from './key-provider';
import { generateMasterKey, exportMasterKey } from './aes';

let realFetch: typeof fetch;

beforeEach(() => {
	realFetch = globalThis.fetch;
	// Reset to a fresh provider for each test
	setKeyProvider(new MemoryKeyProvider());
});

afterEach(() => {
	globalThis.fetch = realFetch;
	vi.restoreAllMocks();
});

/** Helper: builds a base64 string the server would return for a key. */
async function freshKeyBase64(): Promise<string> {
	const key = await generateMasterKey();
	const raw = await exportMasterKey(key);
	let bin = '';
	for (let i = 0; i < raw.length; i++) bin += String.fromCharCode(raw[i]);
	return btoa(bin);
}

function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
	globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
		const url = typeof input === 'string' ? input : input.toString();
		return handler(url, init);
	}) as typeof fetch;
}

describe('createVaultClient.unlock — happy path', () => {
	it('fetches /key on first unlock and installs the master key', async () => {
		const masterKey = await freshKeyBase64();
		const calls: string[] = [];
		mockFetch((url) => {
			calls.push(url);
			return new Response(JSON.stringify({ masterKey, formatVersion: 1, kekId: 'env-v1' }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			});
		});

		const client = createVaultClient({
			authUrl: 'http://localhost:3001',
			getToken: () => 'test-jwt',
		});

		const state = await client.unlock();
		expect(state).toEqual({ status: 'unlocked' });
		expect(isVaultUnlocked()).toBe(true);
		expect(getActiveKey()).not.toBe(null);
		expect(calls).toEqual(['http://localhost:3001/api/v1/me/encryption-vault/key']);
	});

	it('is idempotent when already unlocked', async () => {
		const masterKey = await freshKeyBase64();
		mockFetch(() => new Response(JSON.stringify({ masterKey }), { status: 200 }));

		const client = createVaultClient({
			authUrl: 'http://localhost:3001',
			getToken: () => 'test-jwt',
		});
		await client.unlock();
		const fetchCount = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length;
		const second = await client.unlock();
		expect(second).toEqual({ status: 'unlocked' });
		// Second call short-circuits without hitting the network
		expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(fetchCount);
	});
});

describe('createVaultClient.unlock — auto-init on 404', () => {
	it('calls /init when /key returns VAULT_NOT_INITIALISED', async () => {
		const masterKey = await freshKeyBase64();
		const calls: string[] = [];
		mockFetch((url) => {
			calls.push(url);
			if (url.endsWith('/key')) {
				return new Response(
					JSON.stringify({ error: 'vault not initialised', code: 'VAULT_NOT_INITIALISED' }),
					{ status: 404, headers: { 'Content-Type': 'application/json' } }
				);
			}
			if (url.endsWith('/init')) {
				return new Response(JSON.stringify({ masterKey, formatVersion: 1, kekId: 'env-v1' }), {
					status: 200,
				});
			}
			return new Response('', { status: 500 });
		});

		const client = createVaultClient({
			authUrl: 'http://localhost:3001',
			getToken: () => 'test-jwt',
		});

		const state = await client.unlock();
		expect(state).toEqual({ status: 'unlocked' });
		expect(calls).toEqual([
			'http://localhost:3001/api/v1/me/encryption-vault/key',
			'http://localhost:3001/api/v1/me/encryption-vault/init',
		]);
	});

	it('does NOT call /init on a generic 404 without the code', async () => {
		mockFetch(() => new Response(JSON.stringify({ error: 'not found' }), { status: 404 }));

		const client = createVaultClient({
			authUrl: 'http://localhost:3001',
			getToken: () => 'test-jwt',
		});

		const state = await client.unlock();
		expect(state.status).toBe('error');
		// Only the /key call happened — no /init follow-up
		expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
	});
});

describe('createVaultClient.unlock — error categorisation', () => {
	it('reports auth error on 401', async () => {
		mockFetch(() => new Response('', { status: 401 }));
		const client = createVaultClient({ authUrl: 'http://x', getToken: () => 't' });
		const state = await client.unlock();
		expect(state).toEqual({ status: 'error', reason: 'auth' });
	});

	it('reports auth error on 403', async () => {
		mockFetch(() => new Response('', { status: 403 }));
		const client = createVaultClient({ authUrl: 'http://x', getToken: () => 't' });
		const state = await client.unlock();
		expect(state).toEqual({ status: 'error', reason: 'auth' });
	});

	it('reports network error when fetch throws', async () => {
		mockFetch(() => {
			throw new Error('Failed to fetch');
		});
		const client = createVaultClient({ authUrl: 'http://x', getToken: () => 't' });
		const state = await client.unlock();
		expect(state).toEqual({ status: 'error', reason: 'network' });
	});

	it('reports auth error when no token is available', async () => {
		mockFetch(() => new Response('', { status: 200 }));
		const client = createVaultClient({ authUrl: 'http://x', getToken: () => null });
		const state = await client.unlock();
		expect(state).toEqual({ status: 'error', reason: 'auth' });
		// No fetch call should have happened
		expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(0);
	});
});

describe('createVaultClient.lock', () => {
	it('clears the active key', async () => {
		const masterKey = await freshKeyBase64();
		mockFetch(() => new Response(JSON.stringify({ masterKey }), { status: 200 }));
		const client = createVaultClient({ authUrl: 'http://x', getToken: () => 't' });
		await client.unlock();
		expect(isVaultUnlocked()).toBe(true);

		client.lock();
		expect(isVaultUnlocked()).toBe(false);
		expect(getActiveKey()).toBe(null);
	});
});

describe('createVaultClient.refetch', () => {
	it('clears and re-fetches the master key', async () => {
		const k1 = await freshKeyBase64();
		const k2 = await freshKeyBase64();
		let call = 0;
		mockFetch(() => {
			const body = call++ === 0 ? k1 : k2;
			return new Response(JSON.stringify({ masterKey: body }), { status: 200 });
		});
		const client = createVaultClient({ authUrl: 'http://x', getToken: () => 't' });
		await client.unlock();
		const before = getActiveKey();
		await client.refetch();
		const after = getActiveKey();
		expect(before).not.toBe(null);
		expect(after).not.toBe(null);
		// Two underlying fetches happened
		expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(2);
	});
});

describe('createVaultClient.rotate', () => {
	it('POSTs /rotate and installs the new key', async () => {
		const masterKey = await freshKeyBase64();
		const calls: { url: string; method?: string }[] = [];
		mockFetch((url, init) => {
			calls.push({ url, method: init?.method });
			return new Response(JSON.stringify({ masterKey }), { status: 200 });
		});
		const client = createVaultClient({ authUrl: 'http://x', getToken: () => 't' });
		const state = await client.rotate();
		expect(state).toEqual({ status: 'unlocked' });
		expect(calls[0].method).toBe('POST');
		expect(calls[0].url).toContain('/rotate');
	});
});
