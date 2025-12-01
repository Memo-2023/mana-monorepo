import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenValidationResponse, CurrentUserData } from '../types';

// Default development test user ID
const DEFAULT_DEV_USER_ID = '00000000-0000-0000-0000-000000000000';

/**
 * JWT Authentication Guard for NestJS backends.
 *
 * Validates JWT tokens by calling the Mana Core Auth service.
 * Supports development mode bypass via DEV_BYPASS_AUTH=true.
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
			const userData = await this.validateToken(token);
			request.user = userData;
			return true;
		} catch (error) {
			if (error instanceof UnauthorizedException) {
				throw error;
			}
			console.error('[JwtAuthGuard] Error validating token:', error);
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
	 * Validate token with Mana Core Auth service
	 */
	private async validateToken(token: string): Promise<CurrentUserData> {
		const authUrl = this.configService.get<string>('MANA_CORE_AUTH_URL') || 'http://localhost:3001';

		const response = await fetch(`${authUrl}/api/v1/auth/validate`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ token }),
		});

		if (!response.ok) {
			const errorText = await response.text().catch(() => 'Unknown error');
			console.error('[JwtAuthGuard] Token validation failed:', response.status, errorText);
			throw new UnauthorizedException('Invalid token');
		}

		const result: TokenValidationResponse = await response.json();

		if (!result.valid || !result.payload) {
			throw new UnauthorizedException(result.error || 'Invalid token');
		}

		return {
			userId: result.payload.sub,
			email: result.payload.email,
			role: result.payload.role,
			sessionId: result.payload.sessionId || result.payload.sid,
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
