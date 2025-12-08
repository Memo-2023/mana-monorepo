import {
	Injectable,
	type CanActivate,
	type ExecutionContext,
	UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { jwtVerify, createRemoteJWKSet } from 'jose';

/**
 * JWT Auth Guard using JWKS (Better Auth compatible)
 *
 * Uses jose library with JWKS endpoint for EdDSA token verification.
 * This is the correct approach for Better Auth which uses EdDSA keys.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
	private jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

	constructor(private configService: ConfigService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const token = this.extractTokenFromHeader(request);

		console.log('[JwtAuthGuard] Token (first 50 chars):', token?.substring(0, 50));

		if (!token) {
			console.log('[JwtAuthGuard] No token provided');
			throw new UnauthorizedException('No token provided');
		}

		try {
			// Lazy initialize JWKS
			if (!this.jwks) {
				const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3001';
				const jwksUrl = new URL('/api/v1/auth/jwks', baseUrl);
				console.log('[JwtAuthGuard] Initializing JWKS from:', jwksUrl.toString());
				this.jwks = createRemoteJWKSet(jwksUrl);
			}

			const issuer = this.configService.get<string>('jwt.issuer') || 'manacore';
			const audience = this.configService.get<string>('jwt.audience') || 'manacore';

			console.log('[JwtAuthGuard] Verifying with issuer:', issuer, 'audience:', audience);

			const { payload } = await jwtVerify(token, this.jwks, {
				issuer,
				audience,
			});

			console.log('[JwtAuthGuard] Verification SUCCESS, user:', payload.sub);

			// Attach user to request
			request.user = {
				userId: payload.sub,
				email: payload.email as string,
				role: payload.role as string,
			};

			return true;
		} catch (error) {
			console.error('[JwtAuthGuard] Token verification FAILED:', error);
			throw new UnauthorizedException('Invalid token');
		}
	}

	private extractTokenFromHeader(request: any): string | undefined {
		const [type, token] = request.headers.authorization?.split(' ') ?? [];
		return type === 'Bearer' ? token : undefined;
	}
}
