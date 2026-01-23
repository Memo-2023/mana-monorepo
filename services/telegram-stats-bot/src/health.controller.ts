import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
	@Get('health')
	health() {
		return {
			status: 'ok',
			service: 'telegram-stats-bot',
			timestamp: new Date().toISOString(),
		};
	}
}
