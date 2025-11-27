import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { type AsyncResult, ok, err, ValidationError, ServiceError } from '@manacore/shared-errors';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { models, type Model } from '../db/schema/models.schema';
import { ChatCompletionDto, ChatCompletionResponseDto } from './dto/chat-completion.dto';

@Injectable()
export class ChatService {
	private readonly logger = new Logger(ChatService.name);
	private readonly apiKey: string;
	private readonly endpoint: string;
	private readonly apiVersion: string;

	constructor(
		private configService: ConfigService,
		@Inject(DATABASE_CONNECTION) private readonly db: Database
	) {
		this.apiKey = this.configService.get<string>('AZURE_OPENAI_API_KEY') || '';
		this.endpoint =
			this.configService.get<string>('AZURE_OPENAI_ENDPOINT') ||
			'https://memoroseopenai.openai.azure.com';
		this.apiVersion =
			this.configService.get<string>('AZURE_OPENAI_API_VERSION') || '2024-12-01-preview';

		if (!this.apiKey) {
			this.logger.warn('AZURE_OPENAI_API_KEY is not set!');
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

		const params = model.parameters as {
			deployment?: string;
			temperature?: number;
			max_tokens?: number;
		} | null;

		const deployment = params?.deployment || 'gpt-4o-mini-se';
		const temperature = dto.temperature ?? params?.temperature ?? 0.7;
		const maxTokens = dto.maxTokens ?? params?.max_tokens ?? 1000;

		// Prepare request body
		const requestBody: Record<string, unknown> = {
			messages: dto.messages.map((msg) => ({
				role: msg.role,
				content: msg.content,
			})),
		};

		// Model-specific parameters
		const isGPTOModel = deployment.includes('gpt-o') || deployment.includes('gpt-4o');

		if (!isGPTOModel) {
			requestBody.max_tokens = maxTokens;
			requestBody.temperature = temperature;
		}

		const url = `${this.endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${this.apiVersion}`;

		this.logger.log(`Sending request to: ${url}`);

		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'api-key': this.apiKey,
				},
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				const errorText = await response.text();
				this.logger.error(`API error: ${response.status} - ${errorText}`);
				return err(ServiceError.externalError('Azure OpenAI', `API error: ${response.status}`));
			}

			const data = await response.json();

			const messageContent = data.choices?.[0]?.message?.content;

			if (!messageContent) {
				this.logger.warn('No message content in response');
				return err(ServiceError.generationFailed('Azure OpenAI', 'No response generated'));
			}

			return ok({
				content: messageContent,
				usage: {
					prompt_tokens: data.usage?.prompt_tokens || 0,
					completion_tokens: data.usage?.completion_tokens || 0,
					total_tokens: data.usage?.total_tokens || 0,
				},
			});
		} catch (error) {
			this.logger.error('Error calling Azure OpenAI API', error);
			return err(
				ServiceError.generationFailed(
					'Azure OpenAI',
					error instanceof Error ? error.message : 'Unknown error',
					error instanceof Error ? error : undefined
				)
			);
		}
	}
}
