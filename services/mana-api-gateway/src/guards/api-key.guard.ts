import {
	Injectable,
	CanActivate,
	ExecutionContext,
	UnauthorizedException,
	ForbiddenException,
} from '@nestjs/common';
import { ApiKeysService, ApiKeyData } from '../api-keys/api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
	constructor(private readonly apiKeyService: ApiKeysService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const apiKey = this.extractApiKey(request);

		if (!apiKey) {
			throw new UnauthorizedException('API key required. Use X-API-Key header.');
		}

		// Validate key
		const keyData = await this.apiKeyService.validateKey(apiKey);

		if (!keyData) {
			throw new UnauthorizedException('Invalid API key');
		}

		if (!keyData.active) {
			throw new UnauthorizedException('API key is disabled');
		}

		if (keyData.expiresAt && new Date(keyData.expiresAt) < new Date()) {
			throw new UnauthorizedException('API key has expired');
		}

		// Check endpoint permission
		const endpoint = this.extractEndpoint(request.path);
		if (!this.hasEndpointPermission(keyData, endpoint)) {
			throw new ForbiddenException(
				`Endpoint '${endpoint}' not allowed for this API key. Upgrade your plan to access this endpoint.`
			);
		}

		// Check IP restriction
		if (!this.hasIpPermission(keyData, request)) {
			throw new ForbiddenException('Request from this IP address is not allowed');
		}

		// Attach key data to request for later use
		request.apiKey = keyData;

		return true;
	}

	private extractApiKey(request: any): string | undefined {
		return request.headers['x-api-key'];
	}

	private extractEndpoint(path: string): string {
		// /v1/search -> search, /v1/stt/transcribe -> stt
		const match = path.match(/\/v1\/(\w+)/);
		return match ? match[1] : 'unknown';
	}

	private hasEndpointPermission(keyData: ApiKeyData, endpoint: string): boolean {
		if (!keyData.allowedEndpoints) return true; // No restrictions
		try {
			const allowed = JSON.parse(keyData.allowedEndpoints) as string[];
			return allowed.includes(endpoint);
		} catch {
			return true;
		}
	}

	private hasIpPermission(keyData: ApiKeyData, request: any): boolean {
		if (!keyData.allowedIps) return true; // No restrictions

		try {
			const allowedIps = JSON.parse(keyData.allowedIps) as string[];
			const clientIp =
				request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
				request.connection?.remoteAddress ||
				request.ip;

			return allowedIps.includes(clientIp);
		} catch {
			return true;
		}
	}
}
