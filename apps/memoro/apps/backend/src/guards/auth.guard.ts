import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthClientService } from '../auth/auth-client.service';
import { JwtPayload } from '../types/jwt-payload.interface';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private authClientService: AuthClientService) {}

	canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
		const request = context.switchToHttp().getRequest();
		return this.validateRequest(request);
	}

	private async validateRequest(request: any): Promise<boolean> {
		const authHeader = request.headers.authorization;

		if (!authHeader) {
			throw new UnauthorizedException('No authorization header provided');
		}

		const [type, token] = authHeader.split(' ');

		if (type !== 'Bearer') {
			throw new UnauthorizedException('Invalid token type');
		}

		if (!token) {
			throw new UnauthorizedException('No token provided');
		}

		try {
			// Validate the token with the Auth service
			const payload = await this.authClientService.validateToken(token);

			// Attach the user payload to the request for controllers to use
			request.user = payload as JwtPayload;
			// Also attach the token for potential forwarding to other services
			request.token = token;

			return true;
		} catch (error) {
			console.error('Auth error:', error.message);
			throw new UnauthorizedException('Invalid token');
		}
	}
}
