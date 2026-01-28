import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
	@Get()
	check() {
		return {
			status: 'ok',
			service: 'matrix-stats-bot',
			timestamp: new Date().toISOString(),
		};
	}
}
