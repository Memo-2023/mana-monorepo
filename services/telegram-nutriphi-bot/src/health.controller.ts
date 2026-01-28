import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
	@Get()
	check() {
		return {
			status: 'ok',
			service: 'telegram-nutriphi-bot',
			timestamp: new Date().toISOString(),
		};
	}
}
