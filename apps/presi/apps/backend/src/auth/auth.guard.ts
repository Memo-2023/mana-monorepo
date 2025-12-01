import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * JWT Auth Guard - Validates tokens via Mana Core Auth service
 *
 * Uses Better Auth with EdDSA algorithm (not RS256).
 * Validates tokens by calling the central auth service's /validate endpoint.
 */
@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private configService: ConfigService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();

		// Development mode: bypass auth if DEV_BYPASS_AUTH is set
		const isDev = this.configService.get<string>('NODE_ENV') === 'development';
		const bypassAuth = this.configService.get<string>('DEV_BYPASS_AUTH') === 'true';

		if (isDev && bypassAuth) {
			request.user = {
				sub: '00000000-0000-0000-0000-000000000000',
				email: 'dev@example.com',
				role: 'user',
			};
			return true;
		}

		const token = this.extractTokenFromHeader(request);

		if (!token) {
			throw new UnauthorizedException('No token provided');
		}

		try {
			// Get Mana Core Auth URL from config
			const authUrl =
				this.configService.get<string>('MANA_CORE_AUTH_URL') || 'http://localhost:3001';

			// Validate token with Mana Core Auth
			const response = await fetch(`${authUrl}/api/v1/auth/validate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token }),
			});

			if (!response.ok) {
				throw new UnauthorizedException('Invalid token');
			}

			const { valid, payload } = await response.json();

			if (!valid || !payload) {
				throw new UnauthorizedException('Invalid token');
			}

			// Attach user to request
			request.user = {
				sub: payload.sub,
				email: payload.email,
				role: payload.role,
				sessionId: payload.sessionId || payload.sid,
			};

			return true;
		} catch (error) {
			if (error instanceof UnauthorizedException) {
				throw error;
			}
			console.error('[AuthGuard] Error validating token:', error);
			throw new UnauthorizedException('Token validation failed');
		}
	}

	private extractTokenFromHeader(request: any): string | undefined {
		const authHeader = request.headers.authorization;
		if (!authHeader) {
			return undefined;
		}
		const [type, token] = authHeader.split(' ');
		return type === 'Bearer' ? token : undefined;
	}
}
