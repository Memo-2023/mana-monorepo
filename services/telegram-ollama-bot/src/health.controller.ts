import { Controller, Get } from '@nestjs/common';
import { OllamaService } from './ollama/ollama.service';

@Controller()
export class HealthController {
	constructor(private readonly ollamaService: OllamaService) {}

	@Get('health')
	async health() {
		const ollamaConnected = await this.ollamaService.checkConnection();

		return {
			status: ollamaConnected ? 'ok' : 'degraded',
			timestamp: new Date().toISOString(),
			ollama: {
				connected: ollamaConnected,
				model: this.ollamaService.getDefaultModel(),
			},
		};
	}
}
