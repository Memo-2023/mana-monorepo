import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck, HealthCheckResult } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
	constructor(private health: HealthCheckService) {}

	@Get()
	@HealthCheck()
	check(): Promise<HealthCheckResult> {
		return this.health.check([]);
	}

	@Get('ready')
	ready() {
		return {
			status: 'ready',
			timestamp: new Date().toISOString(),
		};
	}

	@Get('live')
	live() {
		return {
			status: 'live',
			timestamp: new Date().toISOString(),
			uptime: process.uptime(),
			environment: process.env.NODE_ENV || 'development',
		};
	}
}
