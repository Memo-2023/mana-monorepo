import {
	Injectable,
	CanActivate,
	ExecutionContext,
	UnauthorizedException,
	Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * Guard for internal service-to-service authentication using X-Service-Key header
 */
@Injectable()
export class ServiceAuthGuard implements CanActivate {
	private readonly logger = new Logger(ServiceAuthGuard.name);
	private readonly serviceKey: string;

	constructor(private readonly configService: ConfigService) {
		this.serviceKey = this.configService.get<string>('auth.serviceKey', 'dev-service-key');
	}

	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest<Request>();
		const providedKey = request.headers['x-service-key'] as string;

		if (!providedKey) {
			this.logger.warn('Missing X-Service-Key header');
			throw new UnauthorizedException('Missing service key');
		}

		if (providedKey !== this.serviceKey) {
			this.logger.warn('Invalid service key provided');
			throw new UnauthorizedException('Invalid service key');
		}

		return true;
	}
}
