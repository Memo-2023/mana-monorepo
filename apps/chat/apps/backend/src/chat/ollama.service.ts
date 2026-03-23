import { Injectable, Logger } from '@nestjs/common';
import { LlmClientService } from '@manacore/shared-llm';
import { AsyncResult, ok, err, ServiceError } from '@manacore/shared-errors';
import type { ChatCompletionResponseDto } from './dto/chat-completion.dto';

interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

@Injectable()
export class OllamaService {
	private readonly logger = new Logger(OllamaService.name);

	constructor(private readonly llm: LlmClientService) {
		this.checkConnection();
	}

	async checkConnection(): Promise<boolean> {
		try {
			const health = await this.llm.health();
			const isConnected = health.status === 'healthy' || health.status === 'degraded';
			if (isConnected) {
				const providers = Object.keys(health.providers || {}).join(', ');
				this.logger.log(`mana-llm connected: ${health.status}, providers: ${providers}`);
			}
			return isConnected;
		} catch {
			this.logger.warn('mana-llm not available - local models will not work');
			return false;
		}
	}

	isAvailable(): boolean {
		// Perform a synchronous check based on last known state
		// The actual health is checked on-demand via checkConnection
		return true;
	}

	async createChatCompletion(
		modelName: string,
		messages: ChatMessage[],
		temperature?: number,
		maxTokens?: number
	): AsyncResult<ChatCompletionResponseDto> {
		const normalizedModel = modelName.includes('/') ? modelName : `ollama/${modelName}`;
		this.logger.log(`Sending request to mana-llm model: ${normalizedModel}`);

		try {
			const result = await this.llm.chatMessages(messages, {
				model: normalizedModel,
				temperature,
				maxTokens,
			});

			if (!result.content) {
				this.logger.warn('No message content in mana-llm response');
				return err(ServiceError.generationFailed('mana-llm', 'No response generated'));
			}

			if (result.usage.completion_tokens) {
				this.logger.debug(
					`Generated ${result.usage.completion_tokens} tokens (total: ${result.usage.total_tokens})`
				);
			}

			return ok({
				content: result.content,
				usage: {
					prompt_tokens: result.usage.prompt_tokens,
					completion_tokens: result.usage.completion_tokens,
					total_tokens: result.usage.total_tokens,
				},
			});
		} catch (error) {
			if (error instanceof Error && error.name === 'TimeoutError') {
				this.logger.error('mana-llm request timed out');
				return err(ServiceError.generationFailed('mana-llm', 'Request timed out'));
			}

			this.logger.error('Error calling mana-llm API', error);
			return err(
				ServiceError.generationFailed(
					'mana-llm',
					error instanceof Error ? error.message : 'Unknown error',
					error instanceof Error ? error : undefined
				)
			);
		}
	}

	async listModels(): Promise<string[]> {
		try {
			const models = await this.llm.listModels();
			return models.map((m) => m.id);
		} catch {
			return [];
		}
	}
}
