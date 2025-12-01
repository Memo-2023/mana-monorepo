import {
	Injectable,
	CanActivate,
	ExecutionContext,
	UnauthorizedException,
	Inject,
	Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { MANA_CORE_OPTIONS } from '../mana-core.module';
import { ManaCoreModuleOptions } from '../interfaces/mana-core-options.interface';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

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

// Default development test user ID
const DEFAULT_DEV_USER_ID = '00000000-0000-0000-0000-000000000000';

/**
 * JWT Authentication Guard for NestJS backends.
 *
 * Validates JWT tokens by calling the Mana Core Auth service.
 * Supports development mode bypass via DEV_BYPASS_AUTH=true.
 */
@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		@Optional()
		@Inject(MANA_CORE_OPTIONS)
		private readonly options?: ManaCoreModuleOptions,
		@Optional()
		private readonly reflector?: Reflector,
		@Optional()
		private readonly configService?: ConfigService
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		// Check if route is marked as public
		if (this.reflector) {
			const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
				context.getHandler(),
				context.getClass(),
			]);
			if (isPublic) {
				return true;
			}
		}

		const request = context.switchToHttp().getRequest();

		// Development mode: bypass auth if DEV_BYPASS_AUTH is set
		if (this.shouldBypassAuth()) {
			request.user = this.getDevUser();
			return true;
		}

		const token = this.extractTokenFromHeader(request);

		if (!token) {
			throw new UnauthorizedException('No authorization token provided');
		}

		try {
			const userData = await this.validateToken(token);
			request.user = userData;
			request.accessToken = token;

			if (this.options?.debug) {
				console.log('[AuthGuard] User authenticated:', userData.sub);
			}

			return true;
		} catch (error) {
			if (error instanceof UnauthorizedException) {
				throw error;
			}
			if (this.options?.debug) {
				console.error('[AuthGuard] Token validation failed:', error);
			}
			throw new UnauthorizedException('Invalid or expired token');
		}
	}

	/**
	 * Check if auth should be bypassed (development mode)
	 */
	private shouldBypassAuth(): boolean {
		const isDev =
			this.configService?.get<string>('NODE_ENV') === 'development' ||
			process.env.NODE_ENV === 'development';
		const bypassAuth =
			this.configService?.get<string>('DEV_BYPASS_AUTH') === 'true' ||
			process.env.DEV_BYPASS_AUTH === 'true';
		return isDev && bypassAuth;
	}

	/**
	 * Get development user data
	 */
	private getDevUser() {
		const devUserId =
			this.configService?.get<string>('DEV_USER_ID') ||
			process.env.DEV_USER_ID ||
			DEFAULT_DEV_USER_ID;
		return {
			sub: devUserId,
			email: 'dev@example.com',
			role: 'user',
			app_id: this.options?.appId,
		};
	}

	/**
	 * Validate token with Mana Core Auth service
	 */
	private async validateToken(token: string): Promise<any> {
		const authUrl =
			this.configService?.get<string>('MANA_CORE_AUTH_URL') ||
			process.env.MANA_CORE_AUTH_URL ||
			'http://localhost:3001';

		const response = await fetch(`${authUrl}/api/v1/auth/validate`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ token }),
		});

		if (!response.ok) {
			const errorText = await response.text().catch(() => 'Unknown error');
			if (this.options?.debug) {
				console.error('[AuthGuard] Token validation failed:', response.status, errorText);
			}
			throw new UnauthorizedException('Invalid token');
		}

		const result = (await response.json()) as TokenValidationResponse;

		if (!result.valid || !result.payload) {
			throw new UnauthorizedException(result.error || 'Invalid token');
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
