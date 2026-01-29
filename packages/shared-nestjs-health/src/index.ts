import { Controller, DynamicModule, Get, Module } from '@nestjs/common';

/**
 * Health check response
 */
export interface HealthCheckResponse {
	status: 'ok' | 'error';
	service: string;
	timestamp: string;
	version?: string;
	uptime?: number;
}

/**
 * Options for configuring the health module
 */
export interface HealthModuleOptions {
	/**
	 * Service name to include in health response
	 * @example 'chat-backend'
	 */
	serviceName: string;

	/**
	 * Optional version string
	 * @example '1.0.0'
	 */
	version?: string;

	/**
	 * Include uptime in response (default: false)
	 */
	includeUptime?: boolean;

	/**
	 * Custom route path (default: 'health')
	 */
	route?: string;
}

/**
 * Create a health controller with the given options
 */
function createHealthController(options: HealthModuleOptions) {
	const route = options.route || 'health';

	@Controller(route)
	class HealthController {
		@Get()
		check(): HealthCheckResponse {
			const response: HealthCheckResponse = {
				status: 'ok',
				service: options.serviceName,
				timestamp: new Date().toISOString(),
			};

			if (options.version) {
				response.version = options.version;
			}

			if (options.includeUptime) {
				response.uptime = process.uptime();
			}

			return response;
		}
	}

	return HealthController;
}

/**
 * Shared health check module for NestJS backends
 *
 * Provides a simple health endpoint that returns:
 * - status: 'ok'
 * - service: configured service name
 * - timestamp: ISO timestamp
 * - version: (optional) service version
 * - uptime: (optional) process uptime in seconds
 *
 * @example
 * ```typescript
 * // Basic usage
 * @Module({
 *   imports: [HealthModule.forRoot({ serviceName: 'chat-backend' })],
 * })
 * export class AppModule {}
 *
 * // With all options
 * @Module({
 *   imports: [
 *     HealthModule.forRoot({
 *       serviceName: 'chat-backend',
 *       version: '1.0.0',
 *       includeUptime: true,
 *       route: 'health', // default
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class HealthModule {
	static forRoot(options: HealthModuleOptions): DynamicModule {
		const HealthController = createHealthController(options);

		return {
			module: HealthModule,
			controllers: [HealthController],
		};
	}
}
