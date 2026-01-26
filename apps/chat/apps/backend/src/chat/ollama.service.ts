import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AsyncResult, ok, err, ServiceError } from '@manacore/shared-errors';
import type { ChatCompletionResponseDto } from './dto/chat-completion.dto';

interface OllamaChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

interface OllamaChatResponse {
	model: string;
	message: {
		role: string;
		content: string;
	};
	done: boolean;
	total_duration?: number;
	eval_count?: number;
	eval_duration?: number;
	prompt_eval_count?: number;
}

@Injectable()
export class OllamaService {
	private readonly logger = new Logger(OllamaService.name);
	private readonly baseUrl: string;
	private readonly timeout: number;
	private isConnected = false;

	constructor(private configService: ConfigService) {
		this.baseUrl = this.configService.get<string>('OLLAMA_URL') || 'http://localhost:11434';
		this.timeout = this.configService.get<number>('OLLAMA_TIMEOUT') || 120000;

		// Check connection on startup
		this.checkConnection();
	}

	async checkConnection(): Promise<boolean> {
		try {
			const response = await fetch(`${this.baseUrl}/api/version`, {
				signal: AbortSignal.timeout(5000),
			});
			if (response.ok) {
				const data = await response.json();
				this.isConnected = true;
				this.logger.log(`Ollama connected: v${data.version} at ${this.baseUrl}`);
				return true;
			}
			this.isConnected = false;
			return false;
		} catch (error) {
			this.isConnected = false;
			this.logger.warn(`Ollama not available at ${this.baseUrl} - local models will not work`);
			return false;
		}
	}

	isAvailable(): boolean {
		return this.isConnected;
	}

	async createChatCompletion(
		modelName: string,
		messages: OllamaChatMessage[],
		temperature?: number,
		maxTokens?: number
	): AsyncResult<ChatCompletionResponseDto> {
		if (!this.isConnected) {
			// Try to reconnect
			await this.checkConnection();
			if (!this.isConnected) {
				return err(
					ServiceError.externalError('Ollama', `Ollama server not available at ${this.baseUrl}`)
				);
			}
		}

		this.logger.log(`Sending request to Ollama model: ${modelName}`);

		try {
			const requestBody: Record<string, unknown> = {
				model: modelName,
				messages,
				stream: false,
			};

			// Add options if provided
			const options: Record<string, unknown> = {};
			if (temperature !== undefined) {
				options.temperature = temperature;
			}
			if (maxTokens !== undefined) {
				options.num_predict = maxTokens;
			}
			if (Object.keys(options).length > 0) {
				requestBody.options = options;
			}

			const response = await fetch(`${this.baseUrl}/api/chat`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestBody),
				signal: AbortSignal.timeout(this.timeout),
			});

			if (!response.ok) {
				const errorText = await response.text();
				this.logger.error(`Ollama API error: ${response.status} - ${errorText}`);
				return err(ServiceError.externalError('Ollama', `API error: ${response.status}`));
			}

			const data: OllamaChatResponse = await response.json();

			if (!data.message?.content) {
				this.logger.warn('No message content in Ollama response');
				return err(ServiceError.generationFailed('Ollama', 'No response generated'));
			}

			// Calculate token usage from Ollama metrics
			const promptTokens = data.prompt_eval_count || 0;
			const completionTokens = data.eval_count || 0;

			// Log performance metrics
			if (data.eval_count && data.eval_duration) {
				const tokensPerSec = (data.eval_count / data.eval_duration) * 1e9;
				this.logger.debug(`Generated ${data.eval_count} tokens at ${tokensPerSec.toFixed(1)} t/s`);
			}

			return ok({
				content: data.message.content,
				usage: {
					prompt_tokens: promptTokens,
					completion_tokens: completionTokens,
					total_tokens: promptTokens + completionTokens,
				},
			});
		} catch (error) {
			if (error instanceof Error && error.name === 'TimeoutError') {
				this.logger.error('Ollama request timed out');
				return err(ServiceError.generationFailed('Ollama', 'Request timed out'));
			}

			this.logger.error('Error calling Ollama API', error);
			return err(
				ServiceError.generationFailed(
					'Ollama',
					error instanceof Error ? error.message : 'Unknown error',
					error instanceof Error ? error : undefined
				)
			);
		}
	}

	async listModels(): Promise<string[]> {
		try {
			const response = await fetch(`${this.baseUrl}/api/tags`, {
				signal: AbortSignal.timeout(5000),
			});
			if (!response.ok) {
				return [];
			}
			const data = await response.json();
			return (data.models || []).map((m: { name: string }) => m.name);
		} catch {
			return [];
		}
	}
}
