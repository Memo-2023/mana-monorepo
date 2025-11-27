import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseProvider } from '../supabase/supabase.provider';
import { HealthCheckResult, ServiceStatus } from './health.interface';

@Injectable()
export class HealthService {
	private readonly logger = new Logger(HealthService.name);

	constructor(
		private readonly configService: ConfigService,
		private readonly supabaseProvider: SupabaseProvider
	) {}

	async checkHealth(): Promise<HealthCheckResult> {
		const startTime = Date.now();
		const services: ServiceStatus[] = [];

		// Check Supabase connection
		const supabaseStatus = await this.checkSupabase();
		services.push(supabaseStatus);

		// Check Mana service
		const manaStatus = await this.checkManaService();
		services.push(manaStatus);

		// Check AI services
		const aiStatus = await this.checkAIServices();
		services.push(aiStatus);

		const allHealthy = services.every((s) => s.status === 'healthy');
		const duration = Date.now() - startTime;

		return {
			status: allHealthy ? 'healthy' : 'degraded',
			timestamp: new Date().toISOString(),
			duration,
			services,
			version: process.env.npm_package_version || '1.0.0',
			environment: process.env.NODE_ENV || 'development',
		};
	}

	async checkReadiness(): Promise<HealthCheckResult> {
		const startTime = Date.now();
		const services: ServiceStatus[] = [];

		// Check critical services for readiness
		const supabaseStatus = await this.checkSupabase();
		services.push(supabaseStatus);

		const allReady = services.every((s) => s.status === 'healthy');
		const duration = Date.now() - startTime;

		return {
			status: allReady ? 'healthy' : 'not_ready',
			timestamp: new Date().toISOString(),
			duration,
			services,
			version: process.env.npm_package_version || '1.0.0',
			environment: process.env.NODE_ENV || 'development',
		};
	}

	async checkLiveness(): Promise<HealthCheckResult> {
		// Simple liveness check - if the service responds, it's alive
		return {
			status: 'healthy',
			timestamp: new Date().toISOString(),
			duration: 0,
			services: [],
			version: process.env.npm_package_version || '1.0.0',
			environment: process.env.NODE_ENV || 'development',
		};
	}

	private async checkSupabase(): Promise<ServiceStatus> {
		try {
			const startTime = Date.now();

			// Try a simple query to check connection
			const { error } = await this.supabaseProvider
				.getClient()
				.from('characters')
				.select('id')
				.limit(1);

			const responseTime = Date.now() - startTime;

			if (error) {
				this.logger.error('Supabase health check failed', error);
				return {
					name: 'supabase',
					status: 'unhealthy',
					responseTime,
					error: error.message,
				};
			}

			return {
				name: 'supabase',
				status: 'healthy',
				responseTime,
			};
		} catch (error) {
			this.logger.error('Supabase health check exception', error);
			return {
				name: 'supabase',
				status: 'unhealthy',
				responseTime: -1,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	private async checkManaService(): Promise<ServiceStatus> {
		try {
			const startTime = Date.now();
			const manaUrl = this.configService.get<string>('MANA_SERVICE_URL');

			// Use fetch to check Mana service health
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 5000);

			const response = await fetch(`${manaUrl}/health`, {
				signal: controller.signal,
			});

			clearTimeout(timeoutId);
			const responseTime = Date.now() - startTime;

			if (!response.ok) {
				return {
					name: 'mana-service',
					status: 'unhealthy',
					responseTime,
					error: `HTTP ${response.status}`,
				};
			}

			return {
				name: 'mana-service',
				status: 'healthy',
				responseTime,
			};
		} catch (error) {
			this.logger.error('Mana service health check failed', error);
			return {
				name: 'mana-service',
				status: 'unhealthy',
				responseTime: -1,
				error: error instanceof Error ? error.message : String(error),
			};
		}
	}

	private async checkAIServices(): Promise<ServiceStatus> {
		// Check if AI service environment variables are configured
		const hasGeminiKey = !!process.env.MAERCHENZAUBER_GOOGLE_GENAI_API_KEY;
		const hasReplicateKey = !!process.env.MAERCHENZAUBER_REPLICATE_API_KEY;

		if (!hasGeminiKey && !hasReplicateKey) {
			return {
				name: 'ai-services',
				status: 'unhealthy',
				responseTime: 0,
				error: 'No AI service keys configured',
			};
		}

		return {
			name: 'ai-services',
			status: 'healthy',
			responseTime: 0,
			metadata: {
				gemini: hasGeminiKey ? 'configured' : 'not_configured',
				replicate: hasReplicateKey ? 'configured' : 'not_configured',
			},
		};
	}
}
