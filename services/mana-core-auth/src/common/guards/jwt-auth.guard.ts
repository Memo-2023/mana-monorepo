import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
	constructor(private configService: ConfigService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const token = this.extractTokenFromHeader(request);

		if (!token) {
			throw new UnauthorizedException('No token provided');
		}

		try {
			const publicKey = this.configService.get<string>('jwt.publicKey');
			if (!publicKey) {
				throw new UnauthorizedException('JWT configuration error');
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

			return true;
		} catch (error) {
			throw new UnauthorizedException('Invalid token');
		}
	}

	private extractTokenFromHeader(request: any): string | undefined {
		const [type, token] = request.headers.authorization?.split(' ') ?? [];
		return type === 'Bearer' ? token : undefined;
	}
}
