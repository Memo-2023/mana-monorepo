import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { ApiKeyData } from '../../api-keys/api-keys.service';
import { ApiKeysService } from '../../api-keys/api-keys.service';
import { UsageService } from '../../usage/usage.service';
import { CreditsService } from '../../credits/credits.service';
import { CREDIT_COSTS } from '../../config/pricing';

@Injectable()
export class UsageTrackingInterceptor implements NestInterceptor {
	constructor(
		private readonly usageService: UsageService,
		private readonly creditsService: CreditsService,
		private readonly apiKeysService: ApiKeysService
	) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const request = context.switchToHttp().getRequest();
		const response = context.switchToHttp().getResponse();
		const apiKey = request.apiKey as ApiKeyData;
		const startTime = Date.now();

		if (!apiKey) {
			return next.handle();
		}

		return next.handle().pipe(
			tap(async (responseBody) => {
				const latencyMs = Date.now() - startTime;
				const endpoint = this.extractEndpoint(request.path);

				// Calculate credits
				const creditsUsed = this.calculateCredits(endpoint, request, responseBody);

				// Track usage
				await this.usageService.track({
					apiKeyId: apiKey.id,
					endpoint,
					method: request.method,
					path: request.path,
					latencyMs,
					statusCode: response.statusCode || 200,
					creditsUsed,
					metadata: {
						userAgent: request.headers['user-agent'],
					},
				});

				// Increment credits used on the API key
				if (creditsUsed > 0) {
					await this.apiKeysService.incrementCreditsUsed(apiKey.id, creditsUsed);
				}

				// Deduct credits from user account if applicable
				if (apiKey.userId && creditsUsed > 0) {
					try {
						await this.creditsService.deduct(apiKey.userId, creditsUsed, {
							appId: 'api-gateway',
							description: `API: ${endpoint}`,
							apiKeyId: apiKey.id,
						});
					} catch (error) {
						// Log but don't fail the request
						console.error('Failed to deduct credits from user account:', error);
					}
				}
			}),
			catchError(async (error) => {
				const latencyMs = Date.now() - startTime;
				const endpoint = this.extractEndpoint(request.path);

				// Track failed requests (no credits deducted)
				await this.usageService.track({
					apiKeyId: apiKey.id,
					endpoint,
					method: request.method,
					path: request.path,
					latencyMs,
					statusCode: error.status || 500,
					creditsUsed: 0,
					metadata: {
						userAgent: request.headers['user-agent'],
						error: error.message,
					},
				});

				throw error;
			})
		);
	}

	private extractEndpoint(path: string): string {
		const match = path.match(/\/v1\/(\w+)/);
		return match ? match[1] : 'unknown';
	}

	private calculateCredits(endpoint: string, request: any, response: any): number {
		switch (endpoint) {
			case 'search':
				return CREDIT_COSTS.search;
			case 'tts':
				const text = request.body?.text || '';
				return Math.max(1, Math.ceil(text.length / 1000) * CREDIT_COSTS.tts.per1000Chars);
			case 'stt':
				// Calculate from actual audio duration if available in response
				const minutes = response?.duration ? response.duration / 60 : 1;
				return Math.max(1, Math.ceil(minutes) * CREDIT_COSTS.stt.perMinute);
			default:
				return 0;
		}
	}
}
