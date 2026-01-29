import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AsyncResult, ok, err, ServiceError } from '@manacore/shared-errors';
import type { ChatCompletionResponseDto } from './dto/chat-completion.dto';

interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

interface ChatCompletionResponse {
	id: string;
	model: string;
	choices: {
		message: { role: string; content: string };
		finish_reason: string;
	}[];
	usage: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
}

interface LlmModel {
	id: string;
	owned_by: string;
}

@Injectable()
export class OllamaService {
	private readonly logger = new Logger(OllamaService.name);
	private readonly baseUrl: string;
	private readonly timeout: number;
	private isConnected = false;

	constructor(private configService: ConfigService) {
		this.baseUrl = this.configService.get<string>('MANA_LLM_URL') || 'http://localhost:3025';
		this.timeout = this.configService.get<number>('LLM_TIMEOUT') || 120000;

		// Check connection on startup
		this.checkConnection();
	}

	async checkConnection(): Promise<boolean> {
		try {
			const response = await fetch(`${this.baseUrl}/health`, {
				signal: AbortSignal.timeout(5000),
			});
			if (response.ok) {
				const data = await response.json();
				this.isConnected = data.status === 'healthy' || data.status === 'degraded';
				if (this.isConnected) {
					const providers = Object.keys(data.providers || {}).join(', ');
					this.logger.log(`mana-llm connected: ${data.status}, providers: ${providers}`);
				}
				return this.isConnected;
			}
			this.isConnected = false;
			return false;
		} catch (error) {
			this.isConnected = false;
			this.logger.warn(`mana-llm not available at ${this.baseUrl} - local models will not work`);
			return false;
		}
	}

	isAvailable(): boolean {
		return this.isConnected;
	}

	async createChatCompletion(
		modelName: string,
		messages: ChatMessage[],
		temperature?: number,
		maxTokens?: number
	): AsyncResult<ChatCompletionResponseDto> {
		if (!this.isConnected) {
			// Try to reconnect
			await this.checkConnection();
			if (!this.isConnected) {
				return err(
					ServiceError.externalError('mana-llm', `mana-llm server not available at ${this.baseUrl}`)
				);
			}
		}

		// Normalize model name to include ollama/ prefix if it doesn't have a provider
		const normalizedModel = modelName.includes('/') ? modelName : `ollama/${modelName}`;
		this.logger.log(`Sending request to mana-llm model: ${normalizedModel}`);

		try {
			const requestBody: Record<string, unknown> = {
				model: normalizedModel,
				messages,
				stream: false,
			};

			// Add optional parameters
			if (temperature !== undefined) {
				requestBody.temperature = temperature;
			}
			if (maxTokens !== undefined) {
				requestBody.max_tokens = maxTokens;
			}

			const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestBody),
				signal: AbortSignal.timeout(this.timeout),
			});

			if (!response.ok) {
				const errorText = await response.text();
				this.logger.error(`mana-llm API error: ${response.status} - ${errorText}`);
				return err(ServiceError.externalError('mana-llm', `API error: ${response.status}`));
			}

			const data: ChatCompletionResponse = await response.json();

			if (!data.choices?.[0]?.message?.content) {
				this.logger.warn('No message content in mana-llm response');
				return err(ServiceError.generationFailed('mana-llm', 'No response generated'));
			}

			const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

			// Log performance metrics
			if (usage.completion_tokens) {
				this.logger.debug(
					`Generated ${usage.completion_tokens} tokens (total: ${usage.total_tokens})`
				);
			}

			return ok({
				content: data.choices[0].message.content,
				usage: {
					prompt_tokens: usage.prompt_tokens,
					completion_tokens: usage.completion_tokens,
					total_tokens: usage.total_tokens,
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
			const response = await fetch(`${this.baseUrl}/v1/models`, {
				signal: AbortSignal.timeout(5000),
			});
			if (!response.ok) {
				return [];
			}
			const data = await response.json();
			return (data.data || []).map((m: LlmModel) => m.id);
		} catch {
			return [];
		}
	}
}
