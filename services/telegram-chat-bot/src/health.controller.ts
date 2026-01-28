import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
	constructor(private configService: ConfigService) {}

	@Get()
	health() {
		return {
			status: 'ok',
			service: 'telegram-chat-bot',
			timestamp: new Date().toISOString(),
			environment: this.configService.get<string>('nodeEnv'),
		};
	}
}
