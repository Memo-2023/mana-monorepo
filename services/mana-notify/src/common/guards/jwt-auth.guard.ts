import {
	Injectable,
	CanActivate,
	ExecutionContext,
	UnauthorizedException,
	Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { jwtVerify, createRemoteJWKSet, JWTPayload } from 'jose';

export interface AuthenticatedUser {
	userId: string;
	email: string;
	role?: string;
	sessionId?: string;
}

export interface AuthenticatedRequest extends Request {
	user: AuthenticatedUser;
}

/**
 * Guard for user authentication via JWT (validated against mana-core-auth JWKS)
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
	private readonly logger = new Logger(JwtAuthGuard.name);
	private readonly authUrl: string;
	private jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

	constructor(private readonly configService: ConfigService) {
		this.authUrl = this.configService.get<string>('auth.manaCoreAuthUrl', 'http://localhost:3001');
	}

	private getJwks() {
		if (!this.jwks) {
			this.jwks = createRemoteJWKSet(new URL('/api/v1/auth/jwks', this.authUrl));
		}
		return this.jwks;
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
		const authHeader = request.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			throw new UnauthorizedException('Missing or invalid authorization header');
		}

		const token = authHeader.substring(7);

		try {
			const { payload } = await jwtVerify(token, this.getJwks(), {
				issuer: 'manacore',
				audience: 'manacore',
			});

			request.user = this.extractUser(payload);
			return true;
		} catch (error) {
			this.logger.warn(`JWT verification failed: ${error}`);
			throw new UnauthorizedException('Invalid or expired token');
		}
	}

	private extractUser(payload: JWTPayload): AuthenticatedUser {
		return {
			userId: payload.sub as string,
			email: payload.email as string,
			role: payload.role as string | undefined,
			sessionId: payload.sid as string | undefined,
		};
	}
}
