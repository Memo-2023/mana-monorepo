import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
	@Get()
	check() {
		return {
			status: 'ok',
			service: 'matrix-calendar-bot',
			timestamp: new Date().toISOString(),
		};
	}
}
