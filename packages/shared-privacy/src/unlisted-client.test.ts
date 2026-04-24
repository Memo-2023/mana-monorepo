import { describe, it, expect, vi, afterEach } from 'vitest';
import {
	publishUnlistedSnapshot,
	revokeUnlistedSnapshot,
	buildShareUrl,
	UnlistedApiError,
} from './unlisted-client';

const API = 'http://localhost:3060';
const JWT = 'test-jwt';

function mockFetch(impl: (url: string, init: RequestInit) => Promise<Response>) {
	const fetchMock = vi.fn(impl);
	vi.stubGlobal('fetch', fetchMock);
	return fetchMock;
}

describe('publishUnlistedSnapshot', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('POSTs to /api/v1/unlisted/:collection/:recordId with jwt + body', async () => {
		const fetchMock = mockFetch(async () => {
			return new Response(JSON.stringify({ token: 'AbC123', url: 'http://w/share/AbC123' }), {
				status: 201,
				headers: { 'content-type': 'application/json' },
			});
		});

		const res = await publishUnlistedSnapshot({
			apiUrl: API,
			jwt: JWT,
			collection: 'events',
			recordId: '12345678-1234-1234-1234-123456789012',
			spaceId: '_personal:u1',
			blob: { title: 'Concert' },
		});

		expect(res).toEqual({ token: 'AbC123', url: 'http://w/share/AbC123' });
		expect(fetchMock).toHaveBeenCalledWith(
			`${API}/api/v1/unlisted/events/12345678-1234-1234-1234-123456789012`,
			expect.objectContaining({
				method: 'POST',
				headers: expect.objectContaining({
					authorization: `Bearer ${JWT}`,
					'content-type': 'application/json',
				}),
			})
		);

		const body = JSON.parse((fetchMock.mock.calls[0]?.[1]?.body as string) ?? '{}');
		expect(body).toEqual({
			spaceId: '_personal:u1',
			blob: { title: 'Concert' },
		});
	});

	it('includes expiresAt as ISO string when provided', async () => {
		const fetchMock = mockFetch(async () => {
			return new Response(JSON.stringify({ token: 'X', url: 'u' }), { status: 200 });
		});
		const exp = new Date('2030-01-15T12:00:00Z');

		await publishUnlistedSnapshot({
			apiUrl: API,
			jwt: JWT,
			collection: 'events',
			recordId: 'abc',
			spaceId: 's',
			blob: {},
			expiresAt: exp,
		});

		const body = JSON.parse((fetchMock.mock.calls[0]?.[1]?.body as string) ?? '{}');
		expect(body.expiresAt).toBe('2030-01-15T12:00:00.000Z');
	});

	it('throws UnlistedApiError with code + status on non-2xx', async () => {
		mockFetch(async () => {
			return new Response(
				JSON.stringify({ error: 'Collection not allowed', code: 'COLLECTION_NOT_ALLOWED' }),
				{ status: 400, headers: { 'content-type': 'application/json' } }
			);
		});

		await expect(
			publishUnlistedSnapshot({
				apiUrl: API,
				jwt: JWT,
				collection: 'forbidden',
				recordId: 'abc',
				spaceId: 's',
				blob: {},
			})
		).rejects.toMatchObject({
			name: 'UnlistedApiError',
			status: 400,
			code: 'COLLECTION_NOT_ALLOWED',
			message: 'Collection not allowed',
		});
	});

	it('falls back to generic error when server returns no JSON body', async () => {
		mockFetch(async () => new Response('Internal Server Error', { status: 500 }));

		const promise = publishUnlistedSnapshot({
			apiUrl: API,
			jwt: JWT,
			collection: 'events',
			recordId: 'abc',
			spaceId: 's',
			blob: {},
		});
		await expect(promise).rejects.toBeInstanceOf(UnlistedApiError);
		await expect(promise).rejects.toMatchObject({ status: 500, code: 'UNKNOWN' });
	});

	it('trims trailing slash from apiUrl', async () => {
		const fetchMock = mockFetch(async () => {
			return new Response(JSON.stringify({ token: 'x', url: 'u' }), { status: 200 });
		});

		await publishUnlistedSnapshot({
			apiUrl: 'http://localhost:3060/',
			jwt: JWT,
			collection: 'events',
			recordId: 'abc',
			spaceId: 's',
			blob: {},
		});

		expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:3060/api/v1/unlisted/events/abc');
	});
});

describe('revokeUnlistedSnapshot', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('DELETEs /api/v1/unlisted/:collection/:recordId with jwt', async () => {
		const fetchMock = mockFetch(async () => {
			return new Response(JSON.stringify({ revoked: 1 }), {
				status: 200,
				headers: { 'content-type': 'application/json' },
			});
		});

		await revokeUnlistedSnapshot({
			apiUrl: API,
			jwt: JWT,
			collection: 'events',
			recordId: 'abc',
		});

		expect(fetchMock).toHaveBeenCalledWith(
			`${API}/api/v1/unlisted/events/abc`,
			expect.objectContaining({
				method: 'DELETE',
				headers: { authorization: `Bearer ${JWT}` },
			})
		);
	});

	it('resolves silently even when server returns { revoked: 0 }', async () => {
		mockFetch(async () => new Response(JSON.stringify({ revoked: 0 }), { status: 200 }));

		await expect(
			revokeUnlistedSnapshot({ apiUrl: API, jwt: JWT, collection: 'events', recordId: 'abc' })
		).resolves.toBeUndefined();
	});

	it('throws UnlistedApiError on non-2xx', async () => {
		mockFetch(
			async () =>
				new Response(JSON.stringify({ error: 'Nope', code: 'NOPE' }), {
					status: 403,
					headers: { 'content-type': 'application/json' },
				})
		);

		await expect(
			revokeUnlistedSnapshot({ apiUrl: API, jwt: JWT, collection: 'events', recordId: 'abc' })
		).rejects.toMatchObject({ status: 403, code: 'NOPE' });
	});
});

describe('buildShareUrl', () => {
	it('joins origin and token with /share/', () => {
		expect(buildShareUrl('https://mana.how', 'AbC123')).toBe('https://mana.how/share/AbC123');
	});

	it('trims trailing slash from origin', () => {
		expect(buildShareUrl('https://mana.how/', 'AbC123')).toBe('https://mana.how/share/AbC123');
	});
});
