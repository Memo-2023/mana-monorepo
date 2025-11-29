import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Development test user ID - used when DEV_BYPASS_AUTH=true
const DEV_USER_ID = '17cb0be7-058a-4964-9e18-1fe7055fd014';

@Injectable()
export class JwtAuthGuard implements CanActivate {
	constructor(private configService: ConfigService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();

		// Development mode: bypass auth if DEV_BYPASS_AUTH is set
		const isDev = this.configService.get<string>('NODE_ENV') === 'development';
		const bypassAuth = this.configService.get<string>('DEV_BYPASS_AUTH') === 'true';

		if (isDev && bypassAuth) {
			// Use test user for development
			request.user = {
				userId: DEV_USER_ID,
				email: 'test@example.com',
				role: 'user',
				sessionId: 'dev-session',
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
				userId: payload.sub,
				email: payload.email,
				role: payload.role,
				sessionId: payload.sessionId,
			};

			return true;
		} catch (error) {
			if (error instanceof UnauthorizedException) {
				throw error;
			}
			console.error('Error validating token:', error);
			throw new UnauthorizedException('Token validation failed');
		}
	}

	private extractTokenFromHeader(request: any): string | undefined {
		const [type, token] = request.headers.authorization?.split(' ') ?? [];
		return type === 'Bearer' ? token : undefined;
	}
}
