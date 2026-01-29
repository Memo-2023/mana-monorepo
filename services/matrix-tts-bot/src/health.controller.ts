import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
	@Get('health')
	health() {
		return {
			status: 'ok',
			service: 'matrix-tts-bot',
			timestamp: new Date().toISOString(),
		};
	}
}
