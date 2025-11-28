import {
	Injectable,
	CanActivate,
	ExecutionContext,
	Inject,
	Optional,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { MANA_CORE_OPTIONS } from '../mana-core.module';
import { ManaCoreModuleOptions } from '../interfaces/mana-core-options.interface';

/**
 * Optional auth guard - allows unauthenticated requests but still extracts user info if token is present
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
	constructor(
		@Optional()
		@Inject(MANA_CORE_OPTIONS)
		private readonly options?: ManaCoreModuleOptions
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
			// Decode the token to extract user information
			const decoded = jwt.decode(token) as jwt.JwtPayload | null;

			if (decoded && decoded.sub) {
				// Attach user info to request
				request.user = {
					sub: decoded.sub,
					email: decoded.email || '',
					role: decoded.role || 'user',
					app_id: decoded.app_id,
					iat: decoded.iat,
					exp: decoded.exp,
				};

				// Store raw token for downstream services
				request.accessToken = token;

				if (this.options?.debug) {
					console.log('[OptionalAuthGuard] User authenticated:', decoded.sub);
				}
			} else {
				request.user = null;
			}
		} catch (error) {
			if (this.options?.debug) {
				console.error('[OptionalAuthGuard] Token decode failed:', error);
			}
			request.user = null;
		}

		return true;
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
