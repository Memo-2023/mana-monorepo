/**
 * Local JWKS Cache Unit Tests
 *
 * Tests the in-memory JWKS cache that reads keys from the database
 * and provides jose-compatible key resolvers for JWT verification.
 *
 * - Happy path: loads keys from DB, returns working resolver
 * - Caching: returns cached result within TTL, refreshes after TTL
 * - Empty DB: throws meaningful error when no keys available
 * - DB failure: propagates errors with meaningful context
 * - Key rotation: picks up new keys after cache expires
 */

import { createCachedLocalJWKSet, clearJwksCache } from './local-jwks-cache';

// Mock the DB connection module
jest.mock('../../db/connection', () => ({
	getDb: jest.fn(),
}));

// Mock jose - we test the cache logic, not jose internals
jest.mock('jose', () => ({
	createLocalJWKSet: jest.fn(),
}));

import { getDb } from '../../db/connection';
import { createLocalJWKSet } from 'jose';

const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;
const mockCreateLocalJWKSet = createLocalJWKSet as jest.MockedFunction<typeof createLocalJWKSet>;

// Sample EdDSA JWK for testing
const sampleJwk = {
	kty: 'OKP',
	crv: 'Ed25519',
	x: 'dGVzdC1wdWJsaWMta2V5LWJhc2U2NA',
	kid: 'test-key-1',
};

const sampleDbRow = {
	id: 'test-key-1',
	publicKey: JSON.stringify(sampleJwk),
	privateKey: '{"kty":"OKP","crv":"Ed25519","d":"private","x":"dGVzdC1wdWJsaWMta2V5LWJhc2U2NA"}',
	createdAt: new Date(),
};

describe('Local JWKS Cache', () => {
	let mockFrom: jest.Mock;
	let mockSelect: jest.Mock;
	let mockResolver: jest.Mock;

	beforeEach(() => {
		jest.clearAllMocks();
		clearJwksCache();

		// Setup DB mock chain: db.select().from(jwks) => rows
		mockFrom = jest.fn();
		mockSelect = jest.fn().mockReturnValue({ from: mockFrom });
		mockGetDb.mockReturnValue({ select: mockSelect } as any);

		// Setup jose mock resolver
		mockResolver = jest.fn().mockResolvedValue({} as CryptoKey);
		mockCreateLocalJWKSet.mockReturnValue(mockResolver as any);
	});

	describe('Happy path', () => {
		it('should read JWKS from DB and return a working key resolver', async () => {
			mockFrom.mockResolvedValue([sampleDbRow]);

			const keyGetter = createCachedLocalJWKSet('postgresql://localhost:5432/test');

			const result = await keyGetter({ alg: 'EdDSA' } as any, {} as any);

			// Should have queried the DB
			expect(mockGetDb).toHaveBeenCalledWith('postgresql://localhost:5432/test');
			expect(mockSelect).toHaveBeenCalled();
			expect(mockFrom).toHaveBeenCalled();

			// Should have created a local JWK set with the parsed keys
			expect(mockCreateLocalJWKSet).toHaveBeenCalledWith({
				keys: [sampleJwk],
			});

			// Should have called the resolver
			expect(mockResolver).toHaveBeenCalledWith({ alg: 'EdDSA' }, {});
		});

		it('should set kid from row id when JWK has no kid', async () => {
			const jwkWithoutKid = { kty: 'OKP', crv: 'Ed25519', x: 'abc123' };
			const row = {
				id: 'row-id-123',
				publicKey: JSON.stringify(jwkWithoutKid),
				privateKey: '{}',
				createdAt: new Date(),
			};

			mockFrom.mockResolvedValue([row]);

			const keyGetter = createCachedLocalJWKSet('postgresql://localhost:5432/test');
			await keyGetter({ alg: 'EdDSA' } as any, {} as any);

			expect(mockCreateLocalJWKSet).toHaveBeenCalledWith({
				keys: [{ ...jwkWithoutKid, kid: 'row-id-123' }],
			});
		});

		it('should handle multiple keys from DB', async () => {
			const secondJwk = { kty: 'OKP', crv: 'Ed25519', x: 'c2Vjb25kLWtleQ', kid: 'key-2' };
			const rows = [
				sampleDbRow,
				{
					id: 'key-2',
					publicKey: JSON.stringify(secondJwk),
					privateKey: '{}',
					createdAt: new Date(),
				},
			];

			mockFrom.mockResolvedValue(rows);

			const keyGetter = createCachedLocalJWKSet('postgresql://localhost:5432/test');
			await keyGetter({ alg: 'EdDSA' } as any, {} as any);

			expect(mockCreateLocalJWKSet).toHaveBeenCalledWith({
				keys: [sampleJwk, secondJwk],
			});
		});

		it('should skip malformed JSON keys without crashing', async () => {
			const rows = [
				{ id: 'bad-key', publicKey: 'not-valid-json{', privateKey: '{}', createdAt: new Date() },
				sampleDbRow,
			];

			mockFrom.mockResolvedValue(rows);

			const keyGetter = createCachedLocalJWKSet('postgresql://localhost:5432/test');
			await keyGetter({ alg: 'EdDSA' } as any, {} as any);

			// Should only include the valid key
			expect(mockCreateLocalJWKSet).toHaveBeenCalledWith({
				keys: [sampleJwk],
			});
		});
	});

	describe('Caching behavior', () => {
		it('should use cached resolver on second call within TTL', async () => {
			mockFrom.mockResolvedValue([sampleDbRow]);

			const keyGetter = createCachedLocalJWKSet('postgresql://localhost:5432/test');

			// First call - reads from DB
			await keyGetter({ alg: 'EdDSA' } as any, {} as any);
			expect(mockFrom).toHaveBeenCalledTimes(1);
			expect(mockCreateLocalJWKSet).toHaveBeenCalledTimes(1);

			// Second call - should use cache
			await keyGetter({ alg: 'EdDSA' } as any, {} as any);
			expect(mockFrom).toHaveBeenCalledTimes(1); // Still 1 - no new DB query
			expect(mockCreateLocalJWKSet).toHaveBeenCalledTimes(1); // Still 1
		});

		it('should refresh cache after TTL expires', async () => {
			mockFrom.mockResolvedValue([sampleDbRow]);

			const keyGetter = createCachedLocalJWKSet('postgresql://localhost:5432/test');

			// First call
			await keyGetter({ alg: 'EdDSA' } as any, {} as any);
			expect(mockFrom).toHaveBeenCalledTimes(1);

			// Advance time past TTL (5 minutes = 300000ms)
			const originalDateNow = Date.now;
			Date.now = jest.fn().mockReturnValue(originalDateNow() + 5 * 60 * 1000 + 1);

			try {
				// Third call after TTL - should refresh
				await keyGetter({ alg: 'EdDSA' } as any, {} as any);
				expect(mockFrom).toHaveBeenCalledTimes(2); // New DB query
				expect(mockCreateLocalJWKSet).toHaveBeenCalledTimes(2); // New resolver created
			} finally {
				Date.now = originalDateNow;
			}
		});

		it('should not refresh cache before TTL expires', async () => {
			mockFrom.mockResolvedValue([sampleDbRow]);

			const keyGetter = createCachedLocalJWKSet('postgresql://localhost:5432/test');

			// First call
			await keyGetter({ alg: 'EdDSA' } as any, {} as any);

			// Advance time to just before TTL (4 minutes 59 seconds)
			const originalDateNow = Date.now;
			Date.now = jest.fn().mockReturnValue(originalDateNow() + 4 * 60 * 1000 + 59 * 1000);

			try {
				await keyGetter({ alg: 'EdDSA' } as any, {} as any);
				expect(mockFrom).toHaveBeenCalledTimes(1); // No refresh
			} finally {
				Date.now = originalDateNow;
			}
		});
	});

	describe('Empty DB', () => {
		it('should throw error when no JWKS keys are in the database', async () => {
			mockFrom.mockResolvedValue([]);

			const keyGetter = createCachedLocalJWKSet('postgresql://localhost:5432/test');

			await expect(keyGetter({ alg: 'EdDSA' } as any, {} as any)).rejects.toThrow(
				'No JWKS keys available in database'
			);
		});

		it('should throw error when all keys have malformed JSON', async () => {
			mockFrom.mockResolvedValue([
				{ id: 'bad-1', publicKey: '{invalid', privateKey: '{}', createdAt: new Date() },
				{ id: 'bad-2', publicKey: 'not json', privateKey: '{}', createdAt: new Date() },
			]);

			const keyGetter = createCachedLocalJWKSet('postgresql://localhost:5432/test');

			await expect(keyGetter({ alg: 'EdDSA' } as any, {} as any)).rejects.toThrow(
				'No JWKS keys available in database'
			);
		});
	});

	describe('DB connection failure', () => {
		it('should propagate database errors with meaningful context', async () => {
			mockFrom.mockRejectedValue(new Error('Connection refused'));

			const keyGetter = createCachedLocalJWKSet('postgresql://localhost:5432/test');

			await expect(keyGetter({ alg: 'EdDSA' } as any, {} as any)).rejects.toThrow(
				'Connection refused'
			);
		});

		it('should propagate timeout errors', async () => {
			mockFrom.mockRejectedValue(new Error('Query timeout'));

			const keyGetter = createCachedLocalJWKSet('postgresql://localhost:5432/test');

			await expect(keyGetter({ alg: 'EdDSA' } as any, {} as any)).rejects.toThrow('Query timeout');
		});

		it('should retry DB read after a failed attempt (no stale error cached)', async () => {
			// First call fails
			mockFrom.mockRejectedValueOnce(new Error('Connection refused'));

			const keyGetter = createCachedLocalJWKSet('postgresql://localhost:5432/test');

			await expect(keyGetter({ alg: 'EdDSA' } as any, {} as any)).rejects.toThrow(
				'Connection refused'
			);

			// Second call should try DB again (not cache the error)
			mockFrom.mockResolvedValueOnce([sampleDbRow]);

			const result = await keyGetter({ alg: 'EdDSA' } as any, {} as any);
			expect(mockFrom).toHaveBeenCalledTimes(2);
			expect(mockCreateLocalJWKSet).toHaveBeenCalledTimes(1);
		});
	});

	describe('Key rotation', () => {
		it('should pick up new keys after cache TTL expires', async () => {
			const originalKey = sampleDbRow;
			const rotatedJwk = { kty: 'OKP', crv: 'Ed25519', x: 'cm90YXRlZC1rZXk', kid: 'rotated-key' };
			const rotatedRow = {
				id: 'rotated-key',
				publicKey: JSON.stringify(rotatedJwk),
				privateKey: '{}',
				createdAt: new Date(),
			};

			// First call returns original key
			mockFrom.mockResolvedValueOnce([originalKey]);

			const keyGetter = createCachedLocalJWKSet('postgresql://localhost:5432/test');
			await keyGetter({ alg: 'EdDSA' } as any, {} as any);

			expect(mockCreateLocalJWKSet).toHaveBeenCalledWith({
				keys: [sampleJwk],
			});

			// Expire the cache
			const originalDateNow = Date.now;
			Date.now = jest.fn().mockReturnValue(originalDateNow() + 5 * 60 * 1000 + 1);

			try {
				// Second call returns rotated key
				mockFrom.mockResolvedValueOnce([rotatedRow]);

				await keyGetter({ alg: 'EdDSA' } as any, {} as any);

				expect(mockCreateLocalJWKSet).toHaveBeenCalledTimes(2);
				expect(mockCreateLocalJWKSet).toHaveBeenLastCalledWith({
					keys: [rotatedJwk],
				});
			} finally {
				Date.now = originalDateNow;
			}
		});

		it('should serve both old and new keys during rotation period', async () => {
			const oldJwk = sampleJwk;
			const newJwk = { kty: 'OKP', crv: 'Ed25519', x: 'bmV3LWtleQ', kid: 'new-key' };

			// DB returns both keys (typical during rotation)
			mockFrom.mockResolvedValue([
				sampleDbRow,
				{
					id: 'new-key',
					publicKey: JSON.stringify(newJwk),
					privateKey: '{}',
					createdAt: new Date(),
				},
			]);

			const keyGetter = createCachedLocalJWKSet('postgresql://localhost:5432/test');
			await keyGetter({ alg: 'EdDSA' } as any, {} as any);

			expect(mockCreateLocalJWKSet).toHaveBeenCalledWith({
				keys: [oldJwk, newJwk],
			});
		});
	});

	describe('clearJwksCache', () => {
		it('should force a DB re-read on next call after clearing', async () => {
			mockFrom.mockResolvedValue([sampleDbRow]);

			const keyGetter = createCachedLocalJWKSet('postgresql://localhost:5432/test');

			// First call
			await keyGetter({ alg: 'EdDSA' } as any, {} as any);
			expect(mockFrom).toHaveBeenCalledTimes(1);

			// Clear cache
			clearJwksCache();

			// Next call should query DB again
			await keyGetter({ alg: 'EdDSA' } as any, {} as any);
			expect(mockFrom).toHaveBeenCalledTimes(2);
		});
	});
});
