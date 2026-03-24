/**
 * Local JWKS Cache
 *
 * Provides in-memory cached JWKS keys for JWT verification without
 * making HTTP requests. Since the auth service IS the JWKS provider,
 * it should read keys directly from the database instead of fetching
 * from its own HTTP endpoint.
 *
 * Uses jose's built-in createLocalJWKSet() for key resolution,
 * wrapping it with a database-backed cache layer.
 */

import { createLocalJWKSet as joseCreateLocalJWKSet } from 'jose';
import type { JWK, JSONWebKeySet, JWSHeaderParameters, FlattenedJWSInput, CryptoKey } from 'jose';
import { getDb } from '../../db/connection';
import { jwks } from '../../db/schema/auth.schema';

interface JwksCache {
	resolver: (
		protectedHeader?: JWSHeaderParameters,
		token?: FlattenedJWSInput
	) => Promise<CryptoKey>;
	expiresAt: number;
}

/** Cache TTL in milliseconds (5 minutes) */
const CACHE_TTL_MS = 5 * 60 * 1000;

/** Module-level cache shared across all consumers within this process */
let cache: JwksCache | null = null;

/**
 * Load JWKS keys from the database and return as a JSONWebKeySet.
 */
async function loadJwksFromDb(databaseUrl: string): Promise<JSONWebKeySet> {
	const db = getDb(databaseUrl);
	const rows = await db.select().from(jwks);

	const keys: JWK[] = [];

	for (const row of rows) {
		try {
			const jwk: JWK = JSON.parse(row.publicKey);

			// Ensure the kid is set (use the row ID if the JWK doesn't have one)
			if (!jwk.kid) {
				jwk.kid = row.id;
			}

			keys.push(jwk);
		} catch {
			// Skip malformed keys
		}
	}

	return { keys };
}

/**
 * Get or refresh the cached JWKS resolver.
 */
async function getCachedResolver(
	databaseUrl: string
): Promise<
	(protectedHeader?: JWSHeaderParameters, token?: FlattenedJWSInput) => Promise<CryptoKey>
> {
	const now = Date.now();

	if (cache && cache.expiresAt > now) {
		return cache.resolver;
	}

	const jwksData = await loadJwksFromDb(databaseUrl);

	if (jwksData.keys.length === 0) {
		throw new Error('No JWKS keys available in database');
	}

	const resolver = joseCreateLocalJWKSet(jwksData);

	cache = {
		resolver,
		expiresAt: now + CACHE_TTL_MS,
	};

	return resolver;
}

/**
 * Create a jose-compatible key getter function that reads JWKS from
 * the local database with in-memory caching.
 *
 * This replaces createRemoteJWKSet() for the auth service itself,
 * avoiding self-referential HTTP requests.
 *
 * @param databaseUrl - PostgreSQL connection URL
 * @returns A function compatible with jose's jwtVerify second argument
 */
export function createCachedLocalJWKSet(
	databaseUrl: string
): (protectedHeader: JWSHeaderParameters, token: FlattenedJWSInput) => Promise<CryptoKey> {
	return async (protectedHeader: JWSHeaderParameters, token: FlattenedJWSInput) => {
		const resolver = await getCachedResolver(databaseUrl);
		return resolver(protectedHeader, token);
	};
}

/**
 * Clear the JWKS cache. Useful for testing or when keys are rotated.
 */
export function clearJwksCache(): void {
	cache = null;
}
