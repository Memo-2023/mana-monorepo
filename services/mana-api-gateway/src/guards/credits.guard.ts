import {
	Injectable,
	CanActivate,
	ExecutionContext,
	HttpException,
	HttpStatus,
} from '@nestjs/common';
import { ApiKeysService, ApiKeyData } from '../api-keys/api-keys.service';
import { CREDIT_COSTS } from '../config/pricing';

@Injectable()
export class CreditsGuard implements CanActivate {
	constructor(private readonly apiKeyService: ApiKeysService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const request = context.switchToHttp().getRequest();
		const apiKey = request.apiKey as ApiKeyData;

		if (!apiKey) {
			return true; // Let ApiKeyGuard handle missing key
		}

		const endpoint = this.extractEndpoint(request.path);
		const estimatedCredits = this.estimateCredits(endpoint, request);

		const hasCredits = await this.apiKeyService.hasEnoughCredits(apiKey.id, estimatedCredits);

		if (!hasCredits) {
			throw new HttpException(
				{
					statusCode: HttpStatus.PAYMENT_REQUIRED,
					message: 'Insufficient credits. Please upgrade your plan or wait for monthly reset.',
					creditsRequired: estimatedCredits,
					creditsUsed: apiKey.creditsUsed,
					monthlyLimit: apiKey.monthlyCredits,
				},
				HttpStatus.PAYMENT_REQUIRED
			);
		}

		return true;
	}

	private extractEndpoint(path: string): string {
		const match = path.match(/\/v1\/(\w+)/);
		return match ? match[1] : 'unknown';
	}

	private estimateCredits(endpoint: string, request: any): number {
		switch (endpoint) {
			case 'search':
				return CREDIT_COSTS.search;
			case 'tts':
				const text = request.body?.text || '';
				return Math.max(1, Math.ceil(text.length / 1000) * CREDIT_COSTS.tts.per1000Chars);
			case 'stt':
				// Estimate based on file size or default to 1 minute
				return CREDIT_COSTS.stt.perMinute;
			default:
				return 0;
		}
	}
}
