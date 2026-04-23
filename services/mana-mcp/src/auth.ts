/**
 * JWT verification for MCP requests.
 *
 * Mirrors the pattern in services/mana-research/src/middleware/jwt-auth.ts —
 * JWKS-cached verification against mana-auth, audience pinned to "mana".
 *
 * Returns the resolved user context (or throws 401) so the MCP transport
 * handler can hand it directly to the registry adapter.
 */

import { createRemoteJWKSet, jwtVerify } from 'jose';

export interface VerifiedUser {
	userId: string;
	email: string;
	role: string;
	tier: string;
	/** Active Space at the moment of the request. May be overridden by `X-Mana-Space`. */
	spaceId: string;
	/** The raw JWT, forwarded to downstream services in tool handlers. */
	jwt: string;
}

let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let cachedJwksUrl: string | null = null;

function getJwks(authUrl: string): ReturnType<typeof createRemoteJWKSet> {
	const url = `${authUrl}/api/auth/jwks`;
	if (cachedJwks && cachedJwksUrl === url) return cachedJwks;
	cachedJwks = createRemoteJWKSet(new URL(url));
	cachedJwksUrl = url;
	return cachedJwks;
}

export class UnauthorizedError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'UnauthorizedError';
	}
}

export async function verifyJwt(
	token: string,
	authUrl: string,
	audience: string
): Promise<Omit<VerifiedUser, 'spaceId' | 'jwt'>> {
	try {
		const { payload } = await jwtVerify(token, getJwks(authUrl), { audience });
		const userId = (payload.sub as string | undefined) ?? '';
		if (!userId) throw new UnauthorizedError('Token has no `sub` claim');
		return {
			userId,
			email: (payload.email as string | undefined) ?? '',
			role: (payload.role as string | undefined) ?? 'user',
			tier: (payload.tier as string | undefined) ?? 'public',
		};
	} catch (err) {
		if (err instanceof UnauthorizedError) throw err;
		throw new UnauthorizedError(
			err instanceof Error ? `Invalid token: ${err.message}` : 'Invalid token'
		);
	}
}

/**
 * Pull `Authorization: Bearer ...` and `X-Mana-Space: ...` out of an
 * incoming Request, verify the token, and return the assembled user
 * context. Throws UnauthorizedError on any auth failure.
 */
export async function authenticateRequest(
	req: Request,
	authUrl: string,
	audience: string
): Promise<VerifiedUser> {
	const header = req.headers.get('authorization');
	if (!header || !header.startsWith('Bearer ')) {
		throw new UnauthorizedError('Missing or malformed Authorization header');
	}
	const token = header.slice('Bearer '.length).trim();
	const verified = await verifyJwt(token, authUrl, audience);

	const spaceHeader = req.headers.get('x-mana-space');
	const spaceId = spaceHeader && spaceHeader.length > 0 ? spaceHeader : '';
	if (!spaceId) {
		// We *could* default to the user's personal Space, but resolving that
		// requires another round-trip to mana-auth. For M1 we require the
		// caller to set X-Mana-Space explicitly — Persona-Runner and Claude
		// Desktop both set it from `spaces.list` results.
		throw new UnauthorizedError('Missing X-Mana-Space header (set to the active Space ID)');
	}

	return { ...verified, spaceId, jwt: token };
}
