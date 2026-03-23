import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { LlmClientService } from '@manacore/shared-llm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OllamaService implements OnModuleInit {
	private readonly logger = new Logger(OllamaService.name);
	private readonly defaultModel: string;

	constructor(
		private readonly llm: LlmClientService,
		private configService: ConfigService
	) {
		this.defaultModel = this.configService.get<string>('llm.model') || 'ollama/gemma3:4b';
	}

	async onModuleInit() {
		await this.checkConnection();
	}

	async checkConnection(): Promise<boolean> {
		try {
			const health = await this.llm.health();
			this.logger.log(
				`mana-llm connected: ${health.status}, providers: ${Object.keys(health.providers || {}).join(', ')}`
			);
			return health.status === 'healthy' || health.status === 'degraded';
		} catch (error) {
			this.logger.error('Failed to connect to mana-llm:', error);
			return false;
		}
	}

	async listModels(): Promise<{ name: string; size: number; modified_at: string }[]> {
		try {
			const models = await this.llm.listModels();
			return models.map((m) => ({
				name: m.id,
				size: 0,
				modified_at: new Date().toISOString(),
			}));
		} catch (error) {
			this.logger.error('Failed to list models:', error);
			return [];
		}
	}

	async chat(
		messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
		model?: string
	): Promise<string> {
		const selectedModel = model ? this.normalizeModel(model) : this.defaultModel;

		const result = await this.llm.chatMessages(messages, { model: selectedModel });

		if (result.usage.completion_tokens) {
			this.logger.debug(
				`Generated ${result.usage.completion_tokens} tokens (total: ${result.usage.total_tokens})`
			);
		}

		return result.content;
	}

	getDefaultModel(): string {
		return this.defaultModel;
	}

	async chatWithImage(prompt: string, imageBase64: string, model?: string): Promise<string> {
		const selectedModel = model ? this.normalizeModel(model) : this.defaultModel;

		const result = await this.llm.vision(prompt, imageBase64, 'image/png', {
			model: selectedModel,
		});

		if (result.usage.completion_tokens) {
			this.logger.debug(
				`Vision: Generated ${result.usage.completion_tokens} tokens (total: ${result.usage.total_tokens})`
			);
		}

		return result.content;
	}

	private normalizeModel(model: string): string {
		if (model.includes('/')) {
			return model;
		}
		return `ollama/${model}`;
	}
}
