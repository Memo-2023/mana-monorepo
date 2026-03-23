import { describe, it, expect, vi, beforeEach } from 'vitest';
import { discoverHomeserver, checkHomeserver, loginWithToken } from './client';

// Mock matrix-js-sdk to avoid importing the full SDK in tests
vi.mock('matrix-js-sdk', () => ({
	createClient: vi.fn(),
}));

vi.mock('./polyfills', () => ({}));

describe('discoverHomeserver', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('extracts domain from Matrix user ID', async () => {
		// Mock .well-known failing so we get the fallback
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

		const result = await discoverHomeserver('@user:example.com');
		expect(result).toBe('https://example.com');
	});

	it('returns null for invalid user ID without domain', async () => {
		const result = await discoverHomeserver('@user');
		expect(result).toBeNull();
	});

	it('uses domain directly when no @ prefix', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

		const result = await discoverHomeserver('matrix.org');
		expect(result).toBe('https://matrix.org');
	});

	it('strips protocol prefix from domain', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')));

		const result = await discoverHomeserver('https://matrix.org');
		expect(result).toBe('https://matrix.org');
	});

	it('uses .well-known base_url when available', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					'm.homeserver': { base_url: 'https://synapse.example.com/' },
				}),
			})
		);

		const result = await discoverHomeserver('example.com');
		expect(result).toBe('https://synapse.example.com');
	});
});

describe('checkHomeserver', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('returns ok for reachable server', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));

		const result = await checkHomeserver('matrix.mana.how');
		expect(result).toEqual({ ok: true });
	});

	it('prepends https:// if missing', async () => {
		const mockFetch = vi.fn().mockResolvedValue({ ok: true });
		vi.stubGlobal('fetch', mockFetch);

		await checkHomeserver('matrix.mana.how');
		expect(mockFetch).toHaveBeenCalledWith('https://matrix.mana.how/_matrix/client/versions', {
			method: 'GET',
		});
	});

	it('does not double-prepend https://', async () => {
		const mockFetch = vi.fn().mockResolvedValue({ ok: true });
		vi.stubGlobal('fetch', mockFetch);

		await checkHomeserver('https://matrix.mana.how');
		expect(mockFetch).toHaveBeenCalledWith('https://matrix.mana.how/_matrix/client/versions', {
			method: 'GET',
		});
	});

	it('returns error for non-ok response', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502 }));

		const result = await checkHomeserver('matrix.mana.how');
		expect(result).toEqual({ ok: false, error: 'Server returned 502' });
	});

	it('returns error for network failure', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')));

		const result = await checkHomeserver('matrix.mana.how');
		expect(result).toEqual({ ok: false, error: 'Failed to fetch' });
	});
});

describe('loginWithToken', () => {
	it('normalizes homeserver URL', async () => {
		const result = await loginWithToken('matrix.mana.how', 'token123', '@user:matrix.mana.how');
		expect(result.success).toBe(true);
		expect(result.credentials?.homeserver).toBe('https://matrix.mana.how');
	});

	it('removes trailing slash from homeserver', async () => {
		const result = await loginWithToken(
			'https://matrix.mana.how/',
			'token123',
			'@user:matrix.mana.how'
		);
		expect(result.credentials?.homeserver).toBe('https://matrix.mana.how');
	});

	it('preserves provided deviceId', async () => {
		const result = await loginWithToken(
			'matrix.mana.how',
			'token123',
			'@user:matrix.mana.how',
			'MYDEVICE'
		);
		expect(result.credentials?.deviceId).toBe('MYDEVICE');
	});

	it('generates deviceId when not provided', async () => {
		const result = await loginWithToken('matrix.mana.how', 'token123', '@user:matrix.mana.how');
		expect(result.credentials?.deviceId).toMatch(/^MANA_\d+$/);
	});
});
