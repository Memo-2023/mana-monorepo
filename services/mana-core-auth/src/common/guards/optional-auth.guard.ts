import { Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { jwtVerify, createRemoteJWKSet } from 'jose';

/**
 * Optional authentication guard using JWKS (Better Auth compatible)
 *
 * Attaches user to request if valid token is present, but doesn't require it.
 * Uses jose library with JWKS endpoint for EdDSA token verification.
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
	private jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

	constructor(private configService: ConfigService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const token = this.extractTokenFromHeader(request);

		if (!token) {
			// No token - allow request but no user
			request.user = null;
			return true;
		}

		try {
			// Lazy initialize JWKS
			if (!this.jwks) {
				const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3001';
				const jwksUrl = new URL('/api/v1/auth/jwks', baseUrl);
				this.jwks = createRemoteJWKSet(jwksUrl);
			}

			// IMPORTANT: Match Better Auth signing config exactly (better-auth.config.ts)
			// Signing uses: issuer = BASE_URL, audience = JWT_AUDIENCE || 'manacore'
			const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3001';
			const issuer = baseUrl; // Better Auth uses BASE_URL as issuer for OIDC compatibility
			const audience = this.configService.get<string>('jwt.audience') || 'manacore';

			const { payload } = await jwtVerify(token, this.jwks, {
				issuer,
				audience,
			});

			// Attach user to request
			request.user = {
				userId: payload.sub,
				email: payload.email as string,
				role: payload.role as string,
			};
		} catch {
			// Invalid token - allow request but no user
			request.user = null;
		}

		return true;
	}

	private extractTokenFromHeader(request: any): string | undefined {
		const [type, token] = request.headers.authorization?.split(' ') ?? [];
		return type === 'Bearer' ? token : undefined;
	}
}
