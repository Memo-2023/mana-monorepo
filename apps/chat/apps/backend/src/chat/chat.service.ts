import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { AsyncResult, ok, err, ValidationError, ServiceError } from '@manacore/shared-errors';
import OpenAI from 'openai';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { models } from '../db/schema/models.schema';
import type { Model } from '../db/schema/models.schema';
import { ChatCompletionDto } from './dto/chat-completion.dto';
import type { ChatCompletionResponseDto } from './dto/chat-completion.dto';

@Injectable()
export class ChatService {
	private readonly logger = new Logger(ChatService.name);
	// OpenRouter config (primary provider)
	private readonly openRouterClient: OpenAI | null = null;

	constructor(
		private configService: ConfigService,
		@Inject(DATABASE_CONNECTION) private readonly db: Database
	) {
		// OpenRouter setup (primary and only provider)
		const openRouterApiKey = this.configService.get<string>('OPENROUTER_API_KEY');
		if (openRouterApiKey) {
			this.openRouterClient = new OpenAI({
				baseURL: 'https://openrouter.ai/api/v1',
				apiKey: openRouterApiKey,
				defaultHeaders: {
					'HTTP-Referer': this.configService.get<string>('APP_URL') || 'http://localhost:3002',
					'X-Title': 'Mana Chat',
				},
			});
			this.logger.log('OpenRouter client initialized');
		} else {
			this.logger.error('OPENROUTER_API_KEY is not set - Chat will not work!');
		}
	}

	async getAvailableModels(): Promise<Model[]> {
		try {
			const result = await this.db.select().from(models).where(eq(models.isActive, true));
			return result;
		} catch (error) {
			this.logger.error('Error fetching models from database', error);
			return [];
		}
	}

	async getModelById(modelId: string): Promise<Model | undefined> {
		try {
			const result = await this.db.select().from(models).where(eq(models.id, modelId)).limit(1);
			return result[0];
		} catch (error) {
			this.logger.error('Error fetching model from database', error);
			return undefined;
		}
	}

	async createCompletion(
		dto: ChatCompletionDto,
		userId?: string
	): AsyncResult<ChatCompletionResponseDto> {
		const model = await this.getModelById(dto.modelId);

		if (!model) {
			return err(ValidationError.invalidInput('modelId', `Model ${dto.modelId} not found`));
		}

		// Log user context for tracking (optional)
		if (userId) {
			this.logger.log(`User ${userId} creating chat completion with model ${dto.modelId}`);
		}

		// All models go through OpenRouter
		return this.createOpenRouterCompletion(model, dto);
	}

	private async createOpenRouterCompletion(
		model: Model,
		dto: ChatCompletionDto
	): AsyncResult<ChatCompletionResponseDto> {
		if (!this.openRouterClient) {
			return err(ServiceError.externalError('OpenRouter', 'OpenRouter client not configured'));
		}

		const params = model.parameters as {
			model?: string;
			temperature?: number;
			max_tokens?: number;
		} | null;

		const modelName = params?.model || 'meta-llama/llama-3.1-8b-instruct';
		const temperature = dto.temperature ?? params?.temperature ?? 0.7;
		const maxTokens = dto.maxTokens ?? params?.max_tokens ?? 4096;

		this.logger.log(`Sending request to OpenRouter model: ${modelName}`);

		try {
			const response = await this.openRouterClient.chat.completions.create({
				model: modelName,
				messages: dto.messages.map((msg) => ({
					role: msg.role as 'system' | 'user' | 'assistant',
					content: msg.content,
				})),
				temperature,
				max_tokens: maxTokens,
			});

			const messageContent = response.choices?.[0]?.message?.content;

			if (!messageContent) {
				this.logger.warn('No message content in OpenRouter response');
				return err(ServiceError.generationFailed('OpenRouter', 'No response generated'));
			}

			return ok({
				content: messageContent,
				usage: {
					prompt_tokens: response.usage?.prompt_tokens || 0,
					completion_tokens: response.usage?.completion_tokens || 0,
					total_tokens: response.usage?.total_tokens || 0,
				},
			});
		} catch (error) {
			this.logger.error('Error calling OpenRouter API', error);
			return err(
				ServiceError.generationFailed(
					'OpenRouter',
					error instanceof Error ? error.message : 'Unknown error',
					error instanceof Error ? error : undefined
				)
			);
		}
	}
}
