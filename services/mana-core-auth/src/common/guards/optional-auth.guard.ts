import { Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

/**
 * Optional authentication guard
 * Attaches user to request if valid token is present, but doesn't require it
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
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
			const publicKey = this.configService.get<string>('jwt.publicKey');
			if (!publicKey) {
				request.user = null;
				return true;
			}

			const audience = this.configService.get<string>('jwt.audience');
			const issuer = this.configService.get<string>('jwt.issuer');

			const payload = jwt.verify(token, publicKey, {
				algorithms: ['RS256'],
				audience,
				issuer,
			}) as jwt.JwtPayload;

			// Attach user to request
			request.user = {
				userId: payload.sub,
				email: payload.email,
				role: payload.role,
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
