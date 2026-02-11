import {
	Injectable,
	CanActivate,
	ExecutionContext,
	UnauthorizedException,
	Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ServiceAuthGuard implements CanActivate {
	private readonly logger = new Logger(ServiceAuthGuard.name);
	private readonly serviceKey: string;

	constructor(private readonly configService: ConfigService) {
		this.serviceKey = this.configService.get<string>('ADMIN_SERVICE_KEY', 'dev-admin-key');
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
