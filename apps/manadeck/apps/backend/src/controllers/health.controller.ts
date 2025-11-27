import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HttpHealthIndicator, HealthCheck } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { Public } from '@mana-core/nestjs-integration/decorators';

@Controller('health')
export class HealthController {
	constructor(
		private health: HealthCheckService,
		private http: HttpHealthIndicator,
		private configService: ConfigService
	) {}

	@Public()
	@Get()
	@HealthCheck()
	check() {
		const manaServiceUrl = this.configService.get<string>('MANA_SERVICE_URL')!;

		return this.health.check([
			() => this.http.pingCheck('mana-core', manaServiceUrl),
			// PostgreSQL health is checked via database module initialization
		]);
	}

	@Public()
	@Get('ready')
	@HealthCheck()
	readiness() {
		return this.health.check([
			() => ({
				ready: {
					status: 'up',
					message: 'Service is ready to receive requests',
				},
			}),
		]);
	}

	@Public()
	@Get('live')
	liveness() {
		return {
			status: 'ok',
			timestamp: new Date(),
			uptime: process.uptime(),
			environment: this.configService.get<string>('NODE_ENV'),
		};
	}
}
