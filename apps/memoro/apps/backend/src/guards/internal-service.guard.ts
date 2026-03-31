import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Guard for internal service-to-service communication.
 * Validates requests using the X-Internal-API-Key header.
 * Used for scheduled jobs and internal microservice calls.
 */
@Injectable()
export class InternalServiceGuard implements CanActivate {
	constructor(private configService: ConfigService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const apiKey = request.headers['x-internal-api-key'];

		if (!apiKey) {
			throw new UnauthorizedException('Missing X-Internal-API-Key header');
		}

		const internalApiKey = this.configService.get<string>('INTERNAL_API_KEY');

		if (!internalApiKey) {
			throw new UnauthorizedException('Internal API key not configured');
		}

		if (apiKey !== internalApiKey) {
			throw new UnauthorizedException('Invalid internal API key');
		}

		// Mark request as internal service call
		request.isInternalService = true;
		return true;
	}
}
