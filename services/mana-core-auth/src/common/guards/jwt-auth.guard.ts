import {
	Injectable,
	type CanActivate,
	type ExecutionContext,
	UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { jwtVerify } from 'jose';
import { LoggerService } from '../logger';
import { createCachedLocalJWKSet } from './local-jwks-cache';

/**
 * JWT Auth Guard using local JWKS cache (Better Auth compatible)
 *
 * Uses jose library with locally cached JWKS keys for EdDSA token verification.
 * Keys are read directly from the database instead of making HTTP requests
 * to the service's own JWKS endpoint.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
	private jwks: ReturnType<typeof createCachedLocalJWKSet> | null = null;
	private readonly logger: LoggerService;

	constructor(
		private configService: ConfigService,
		loggerService: LoggerService
	) {
		this.logger = loggerService.setContext('JwtAuthGuard');
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const token = this.extractTokenFromHeader(request);

		if (!token) {
			throw new UnauthorizedException('No token provided');
		}

		try {
			// Lazy initialize local JWKS (reads from DB, cached in memory)
			if (!this.jwks) {
				const databaseUrl = this.configService.get<string>('database.url') || '';
				this.jwks = createCachedLocalJWKSet(databaseUrl);
			}

			// IMPORTANT: Match Better Auth signing config exactly (better-auth.config.ts)
			// Better Auth uses: issuer = BASE_URL || JWT_ISSUER || 'http://localhost:3001'
			const baseUrl = this.configService.get<string>('BASE_URL');
			const jwtIssuer = this.configService.get<string>('jwt.issuer');
			const issuer = baseUrl || jwtIssuer || 'http://localhost:3001';
			const audience = this.configService.get<string>('jwt.audience') || 'manacore';

			const { payload } = await jwtVerify(token, this.jwks, {
				issuer,
				audience,
			});

			this.logger.debug('Token verification successful', { userId: payload.sub });

			// Attach user to request
			// Include both 'sub' and 'userId' for compatibility with different controllers
			request.user = {
				sub: payload.sub,
				userId: payload.sub,
				email: payload.email as string,
				role: payload.role as string,
			};

			return true;
		} catch (error) {
			this.logger.warn('Token verification failed', {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
			throw new UnauthorizedException('Invalid token');
		}
	}

	private extractTokenFromHeader(request: any): string | undefined {
		const [type, token] = request.headers.authorization?.split(' ') ?? [];
		return type === 'Bearer' ? token : undefined;
	}
}
