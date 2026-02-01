import { Controller, Get, Inject, Optional } from '@nestjs/common';

export const HEALTH_SERVICE_NAME = 'HEALTH_SERVICE_NAME';

export interface HealthResponse {
	status: 'ok' | 'error';
	service: string;
	timestamp: string;
	uptime?: number;
	version?: string;
}

/**
 * Shared health controller for Matrix bots
 *
 * Returns standardized health check response.
 *
 * @example
 * ```typescript
 * // In app.module.ts
 * @Module({
 *   controllers: [HealthController],
 *   providers: [
 *     { provide: HEALTH_SERVICE_NAME, useValue: 'matrix-todo-bot' }
 *   ],
 * })
 * ```
 */
@Controller('health')
export class HealthController {
	private readonly startTime = Date.now();

	constructor(
		@Optional()
		@Inject(HEALTH_SERVICE_NAME)
		private readonly serviceName?: string
	) {}

	@Get()
	check(): HealthResponse {
		return {
			status: 'ok',
			service: this.serviceName || 'matrix-bot',
			timestamp: new Date().toISOString(),
			uptime: Math.floor((Date.now() - this.startTime) / 1000),
		};
	}
}

/**
 * Create a health controller provider with service name
 */
export function createHealthProvider(serviceName: string) {
	return {
		provide: HEALTH_SERVICE_NAME,
		useValue: serviceName,
	};
}
