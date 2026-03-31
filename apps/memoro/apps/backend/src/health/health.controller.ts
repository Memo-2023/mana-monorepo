import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
	constructor(private readonly configService: ConfigService) {}

	@Get()
	checkHealth() {
		// Log debug info when health check is called
		console.error('[HEALTH CHECK DEBUG] Environment check:');
		console.error(
			'[HEALTH CHECK DEBUG] AUDIO_MICROSERVICE_URL from env:',
			process.env.AUDIO_MICROSERVICE_URL
		);
		console.error(
			'[HEALTH CHECK DEBUG] AUDIO_MICROSERVICE_URL from ConfigService:',
			this.configService.get<string>('AUDIO_MICROSERVICE_URL')
		);
		console.error('[HEALTH CHECK DEBUG] NODE_ENV:', process.env.NODE_ENV);

		return {
			status: 'ok',
			timestamp: new Date().toISOString(),
			service: 'memoro-service',
			debug: {
				nodeEnv: process.env.NODE_ENV,
				audioServiceUrl: this.configService.get<string>('AUDIO_MICROSERVICE_URL'),
				audioServiceUrlEnv: process.env.AUDIO_MICROSERVICE_URL,
				port: process.env.PORT || 3001,
				cwd: process.cwd(),
				nodeVersion: process.version,
			},
		};
	}
}
