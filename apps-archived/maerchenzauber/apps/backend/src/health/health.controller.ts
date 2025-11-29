import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthCheckResult } from './health.interface';

@Controller('health')
export class HealthController {
	constructor(private readonly healthService: HealthService) {}

	@Get()
	async checkHealth(): Promise<HealthCheckResult> {
		return this.healthService.checkHealth();
	}

	@Get('ready')
	async checkReadiness(): Promise<HealthCheckResult> {
		return this.healthService.checkReadiness();
	}

	@Get('live')
	async checkLiveness(): Promise<HealthCheckResult> {
		return this.healthService.checkLiveness();
	}
}
