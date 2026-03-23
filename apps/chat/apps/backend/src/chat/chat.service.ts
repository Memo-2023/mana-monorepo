import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { AsyncResult, ok, err, ValidationError, ServiceError } from '@manacore/shared-errors';
import {
	CreditClientService,
	InsufficientCreditsException,
	CreditOperationType,
	CREDIT_COSTS,
} from '@manacore/nestjs-integration';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { models } from '../db/schema/models.schema';
import type { Model } from '../db/schema/models.schema';
import { ChatCompletionDto } from './dto/chat-completion.dto';
import type { ChatCompletionResponseDto } from './dto/chat-completion.dto';
import { OllamaService } from './ollama.service';

@Injectable()
export class ChatService {
	private readonly logger = new Logger(ChatService.name);

	constructor(
		private configService: ConfigService,
		@Inject(DATABASE_CONNECTION) private readonly db: Database,
		private readonly ollamaService: OllamaService,
		private readonly creditClient: CreditClientService
	) {}

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

		// Determine credit operation type and cost based on model
		const creditOperation = this.getCreditOperationForModel(model);
		const creditCost = CREDIT_COSTS[creditOperation];

		// Log user context for tracking (optional)
		if (userId) {
			this.logger.log(
				`User ${userId} creating chat completion with model ${dto.modelId} (${model.provider}) - cost: ${creditCost} credits`
			);

			// Check if user has enough credits (skip in development if no service key)
			const validation = await this.creditClient.validateCredits(
				userId,
				creditOperation,
				creditCost
			);
			if (!validation.hasCredits) {
				throw new InsufficientCreditsException({
					requiredCredits: creditCost,
					availableCredits: validation.availableCredits,
					creditType: 'user',
					operation: creditOperation,
				});
			}
		}

		// Route to appropriate provider based on model configuration
		let result;
		switch (model.provider) {
			case 'ollama':
				result = await this.createOllamaCompletion(model, dto);
				break;
			case 'openrouter':
			default:
				result = await this.createOpenRouterCompletion(model, dto);
				break;
		}

		// Consume credits after successful completion
		if (result.ok && userId) {
			const modelName = this.getModelDisplayName(model);
			const consumed = await this.creditClient.consumeCredits(
				userId,
				creditOperation,
				creditCost,
				`Chat with ${modelName}`,
				{
					modelId: dto.modelId,
					provider: model.provider,
					tokens: result.value.usage?.total_tokens || 0,
				}
			);

			if (!consumed) {
				this.logger.warn(`Failed to consume credits for user ${userId}`);
			} else {
				this.logger.debug(`Consumed ${creditCost} credits for user ${userId}`);
			}
		}

		return result;
	}

	/**
	 * Determine the credit operation type based on the model.
	 */
	private getCreditOperationForModel(model: Model): CreditOperationType {
		const params = model.parameters as { model?: string } | null;
		const modelName = params?.model?.toLowerCase() || '';

		// Local Ollama models - cheapest
		if (model.provider === 'ollama') {
			return CreditOperationType.AI_CHAT_OLLAMA;
		}

		// Cloud models - price based on model family
		if (modelName.includes('gpt-4') || modelName.includes('gpt4')) {
			return CreditOperationType.AI_CHAT_GPT4;
		}
		if (modelName.includes('claude')) {
			return CreditOperationType.AI_CHAT_CLAUDE;
		}
		if (modelName.includes('gemini')) {
			return CreditOperationType.AI_CHAT_GEMINI;
		}
		if (modelName.includes('qwen')) {
			return CreditOperationType.AI_CHAT_QWEN;
		}

		// Default to Gemini pricing for other cloud models
		return CreditOperationType.AI_CHAT_GEMINI;
	}

	/**
	 * Get a display name for the model.
	 */
	private getModelDisplayName(model: Model): string {
		if (model.name) return model.name;
		const params = model.parameters as { model?: string } | null;
		return params?.model || model.provider;
	}

	private async createOllamaCompletion(
		model: Model,
		dto: ChatCompletionDto
	): AsyncResult<ChatCompletionResponseDto> {
		const params = model.parameters as {
			model?: string;
			temperature?: number;
			max_tokens?: number;
		} | null;

		const modelName = params?.model || 'gemma3:4b';
		const temperature = dto.temperature ?? params?.temperature ?? 0.7;
		const maxTokens = dto.maxTokens ?? params?.max_tokens ?? 4096;

		this.logger.log(`Sending request to Ollama model: ${modelName}`);

		return this.ollamaService.createChatCompletion(
			modelName,
			dto.messages.map((msg) => ({
				role: msg.role as 'system' | 'user' | 'assistant',
				content: msg.content,
			})),
			temperature,
			maxTokens
		);
	}

	private async createOpenRouterCompletion(
		model: Model,
		dto: ChatCompletionDto
	): AsyncResult<ChatCompletionResponseDto> {
		const params = model.parameters as {
			model?: string;
			temperature?: number;
			max_tokens?: number;
		} | null;

		// Route through mana-llm with openrouter/ prefix
		const modelName = params?.model || 'meta-llama/llama-3.1-8b-instruct';
		const prefixedModel = modelName.includes('/') ? `openrouter/${modelName}` : modelName;
		const temperature = dto.temperature ?? params?.temperature ?? 0.7;
		const maxTokens = dto.maxTokens ?? params?.max_tokens ?? 4096;

		this.logger.log(`Sending request to mana-llm (OpenRouter): ${prefixedModel}`);

		return this.ollamaService.createChatCompletion(
			prefixedModel,
			dto.messages.map((msg) => ({
				role: msg.role as 'system' | 'user' | 'assistant',
				content: msg.content,
			})),
			temperature,
			maxTokens
		);
	}
}
