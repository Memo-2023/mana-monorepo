import {
	Injectable,
	CanActivate,
	ExecutionContext,
	Inject,
	Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MANA_CORE_OPTIONS } from '../mana-core.module';
import { ManaCoreModuleOptions } from '../interfaces/mana-core-options.interface';

interface TokenValidationResponse {
	valid: boolean;
	payload?: {
		sub: string;
		email: string;
		role: string;
		sessionId?: string;
		sid?: string;
		app_id?: string;
		iat?: number;
		exp?: number;
	};
	error?: string;
}

/**
 * Optional auth guard - allows unauthenticated requests but still validates and extracts user info if token is present
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
	constructor(
		@Optional()
		@Inject(MANA_CORE_OPTIONS)
		private readonly options?: ManaCoreModuleOptions,
		@Optional()
		private readonly configService?: ConfigService
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const token = this.extractTokenFromHeader(request);

		if (!token) {
			// No token - allow request but user will be undefined
			request.user = null;
			return true;
		}

		try {
			const userData = await this.validateToken(token);

			if (userData) {
				request.user = userData;
				request.accessToken = token;

				if (this.options?.debug) {
					console.log('[OptionalAuthGuard] User authenticated:', userData.sub);
				}
			} else {
				request.user = null;
			}
		} catch (error) {
			if (this.options?.debug) {
				console.error('[OptionalAuthGuard] Token validation failed:', error);
			}
			// For optional auth, we allow the request to proceed even if token validation fails
			request.user = null;
		}

		return true;
	}

	/**
	 * Validate token with Mana Core Auth service
	 */
	private async validateToken(token: string): Promise<any | null> {
		const authUrl =
			this.configService?.get<string>('MANA_CORE_AUTH_URL') ||
			process.env.MANA_CORE_AUTH_URL ||
			'http://localhost:3001';

		try {
			const response = await fetch(`${authUrl}/api/v1/auth/validate`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token }),
			});

			if (!response.ok) {
				return null;
			}

			const result = (await response.json()) as TokenValidationResponse;

			if (!result.valid || !result.payload) {
				return null;
			}

			return {
				sub: result.payload.sub,
				email: result.payload.email,
				role: result.payload.role,
				app_id: result.payload.app_id || this.options?.appId,
				sessionId: result.payload.sessionId || result.payload.sid,
				iat: result.payload.iat,
				exp: result.payload.exp,
			};
		} catch {
			return null;
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
