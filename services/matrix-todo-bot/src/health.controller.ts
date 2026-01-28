import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
	@Get()
	check() {
		return {
			status: 'ok',
			service: 'matrix-todo-bot',
			timestamp: new Date().toISOString(),
		};
	}
}
