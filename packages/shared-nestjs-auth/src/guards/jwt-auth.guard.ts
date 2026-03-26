import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { CurrentUserData } from '../types';

// Default development test user ID
const DEFAULT_DEV_USER_ID = '00000000-0000-0000-0000-000000000000';

/** Cached JWKS instance - shared across all guard instances within the same process */
let cachedJWKS: ReturnType<typeof createRemoteJWKSet> | null = null;
let cachedJWKSUrl: string | null = null;

/**
 * JWT Authentication Guard for NestJS backends.
 *
 * Verifies JWT tokens locally using JWKS (JSON Web Key Set) fetched from
 * the Mana Core Auth service. The JWKS is cached automatically by the
 * jose library (~10 min cooldown between refetches).
 *
 * This eliminates the need for an HTTP call per request - tokens are
 * verified locally using the public keys from the JWKS endpoint.
 *
 * @example
 * ```typescript
 * // In your controller
 * @Controller('api')
 * @UseGuards(JwtAuthGuard)
 * export class MyController {
 *   @Get('protected')
 *   getProtected(@CurrentUser() user: CurrentUserData) {
 *     return { userId: user.userId };
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Environment variables
 * MANA_CORE_AUTH_URL=http://localhost:3001
 * DEV_BYPASS_AUTH=true  // Optional: for development
 * DEV_USER_ID=your-test-user-id  // Optional: custom dev user
 * JWT_ISSUER=http://localhost:3001  // Optional: defaults to MANA_CORE_AUTH_URL
 * JWT_AUDIENCE=manacore  // Optional: defaults to 'manacore'
 * ```
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
	constructor(private configService: ConfigService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();

		// Development mode: bypass auth if DEV_BYPASS_AUTH is set
		if (this.shouldBypassAuth()) {
			request.user = this.getDevUser();
			return true;
		}

		const token = this.extractTokenFromHeader(request);

		if (!token) {
			throw new UnauthorizedException('No token provided');
		}

		try {
			const userData = await this.verifyToken(token);
			request.user = userData;
			return true;
		} catch (error) {
			if (error instanceof UnauthorizedException) {
				throw error;
			}
			console.error(
				'[JwtAuthGuard] Token verification failed:',
				error instanceof Error ? error.message : error
			);
			throw new UnauthorizedException('Token validation failed');
		}
	}

	/**
	 * Check if auth should be bypassed (development mode)
	 */
	private shouldBypassAuth(): boolean {
		const isDev = this.configService.get<string>('NODE_ENV') === 'development';
		const bypassAuth = this.configService.get<string>('DEV_BYPASS_AUTH') === 'true';
		return isDev && bypassAuth;
	}

	/**
	 * Get development user data
	 */
	private getDevUser(): CurrentUserData {
		return {
			userId: this.configService.get<string>('DEV_USER_ID') || DEFAULT_DEV_USER_ID,
			email: 'dev@example.com',
			role: 'user',
			sessionId: 'dev-session',
		};
	}

	/**
	 * Get or create the cached JWKS key set.
	 * The jose library's createRemoteJWKSet handles caching internally
	 * with a ~10 minute cooldown between refetches.
	 */
	private getJWKS(): ReturnType<typeof createRemoteJWKSet> {
		const authUrl = this.configService.get<string>('MANA_CORE_AUTH_URL') || 'http://localhost:3001';
		const jwksUrl = `${authUrl}/api/v1/auth/jwks`;

		// Reuse cached JWKS if the URL hasn't changed
		if (cachedJWKS && cachedJWKSUrl === jwksUrl) {
			return cachedJWKS;
		}

		cachedJWKS = createRemoteJWKSet(new URL(jwksUrl));
		cachedJWKSUrl = jwksUrl;
		return cachedJWKS;
	}

	/**
	 * Verify JWT token locally using JWKS
	 */
	private async verifyToken(token: string): Promise<CurrentUserData> {
		const audience = this.configService.get<string>('JWT_AUDIENCE') || 'manacore';

		// Build issuer allowlist: explicit JWT_ISSUER, MANA_CORE_AUTH_URL, and BASE_URL may all differ
		// (e.g. internal Docker URL vs public URL). Accept any of them.
		const issuerCandidates = new Set<string>();
		const jwtIssuer = this.configService.get<string>('JWT_ISSUER');
		const authUrl = this.configService.get<string>('MANA_CORE_AUTH_URL');
		if (jwtIssuer) issuerCandidates.add(jwtIssuer);
		if (authUrl) issuerCandidates.add(authUrl);
		// Always accept the well-known production issuer
		issuerCandidates.add('https://auth.mana.how');
		issuerCandidates.add('http://localhost:3001');

		const jwks = this.getJWKS();

		const { payload } = await jwtVerify(token, jwks, {
			issuer: [...issuerCandidates],
			audience,
		});

		return this.extractUserData(payload);
	}

	/**
	 * Extract user data from verified JWT payload
	 */
	private extractUserData(payload: JWTPayload): CurrentUserData {
		if (!payload.sub) {
			throw new UnauthorizedException('Token missing subject claim');
		}

		return {
			userId: payload.sub,
			email: (payload as any).email || '',
			role: (payload as any).role || 'user',
			sessionId: (payload as any).sid || (payload as any).sessionId,
		};
	}

	/**
	 * Extract Bearer token from Authorization header
	 */
	private extractTokenFromHeader(request: any): string | undefined {
		const authHeader = request.headers.authorization;
		if (!authHeader) {
			return undefined;
		}

		const [type, token] = authHeader.split(' ');
		return type === 'Bearer' ? token : undefined;
	}
}
