import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { type AsyncResult, ok, err, ValidationError, ServiceError } from '@manacore/shared-errors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DATABASE_CONNECTION } from '../db/database.module';
import { type Database } from '../db/connection';
import { models, type Model } from '../db/schema/models.schema';
import { ChatCompletionDto, ChatCompletionResponseDto } from './dto/chat-completion.dto';

@Injectable()
export class ChatService {
	private readonly logger = new Logger(ChatService.name);
	// Azure OpenAI config
	private readonly azureApiKey: string;
	private readonly azureEndpoint: string;
	private readonly azureApiVersion: string;
	// Google Gemini config
	private readonly geminiClient: GoogleGenerativeAI | null = null;

	constructor(
		private configService: ConfigService,
		@Inject(DATABASE_CONNECTION) private readonly db: Database
	) {
		// Azure OpenAI setup
		this.azureApiKey = this.configService.get<string>('AZURE_OPENAI_API_KEY') || '';
		this.azureEndpoint =
			this.configService.get<string>('AZURE_OPENAI_ENDPOINT') ||
			'https://memoroseopenai.openai.azure.com';
		this.azureApiVersion =
			this.configService.get<string>('AZURE_OPENAI_API_VERSION') || '2024-12-01-preview';

		// Google Gemini setup
		const geminiApiKey = this.configService.get<string>('GOOGLE_GENAI_API_KEY');
		if (geminiApiKey) {
			this.geminiClient = new GoogleGenerativeAI(geminiApiKey);
			this.logger.log('Google Gemini client initialized');
		} else {
			this.logger.warn('GOOGLE_GENAI_API_KEY is not set - Gemini models unavailable');
		}

		if (!this.azureApiKey) {
			this.logger.warn('AZURE_OPENAI_API_KEY is not set - Azure models unavailable');
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

		// Route to appropriate provider
		if (model.provider === 'gemini') {
			return this.createGeminiCompletion(model, dto);
		} else {
			return this.createAzureCompletion(model, dto);
		}
	}

	private async createGeminiCompletion(
		model: Model,
		dto: ChatCompletionDto
	): AsyncResult<ChatCompletionResponseDto> {
		if (!this.geminiClient) {
			return err(ServiceError.externalError('Google Gemini', 'Gemini client not configured'));
		}

		const params = model.parameters as {
			model?: string;
			temperature?: number;
			max_tokens?: number;
		} | null;

		const modelName = params?.model || 'gemini-2.5-flash';
		const temperature = dto.temperature ?? params?.temperature ?? 0.7;
		const maxTokens = dto.maxTokens ?? params?.max_tokens ?? 8192;

		this.logger.log(`Sending request to Google Gemini model: ${modelName}`);

		try {
			const genModel = this.geminiClient.getGenerativeModel({
				model: modelName,
				generationConfig: {
					temperature,
					maxOutputTokens: maxTokens,
				},
			});

			// Convert messages to Gemini format
			// Gemini expects alternating user/model messages, with system as first user message
			const systemMessages = dto.messages.filter((m) => m.role === 'system');
			const chatMessages = dto.messages.filter((m) => m.role !== 'system');

			// Build history for chat (all but last message)
			const history = chatMessages.slice(0, -1).map((msg) => ({
				role: msg.role === 'user' ? 'user' : 'model',
				parts: [{ text: msg.content }],
			}));

			// Last message to send
			const lastMessage = chatMessages[chatMessages.length - 1];
			let userPrompt = lastMessage?.content || '';

			// Prepend system instruction if present
			if (systemMessages.length > 0) {
				const systemPrompt = systemMessages.map((m) => m.content).join('\n');
				userPrompt = `${systemPrompt}\n\n${userPrompt}`;
			}

			const chat = genModel.startChat({ history });
			const result = await chat.sendMessage(userPrompt);
			const response = result.response;
			const messageContent = response.text();

			if (!messageContent) {
				this.logger.warn('No message content in Gemini response');
				return err(ServiceError.generationFailed('Google Gemini', 'No response generated'));
			}

			// Gemini provides usage metadata
			const usageMetadata = response.usageMetadata;

			return ok({
				content: messageContent,
				usage: {
					prompt_tokens: usageMetadata?.promptTokenCount || 0,
					completion_tokens: usageMetadata?.candidatesTokenCount || 0,
					total_tokens: usageMetadata?.totalTokenCount || 0,
				},
			});
		} catch (error) {
			this.logger.error('Error calling Google Gemini API', error);
			return err(
				ServiceError.generationFailed(
					'Google Gemini',
					error instanceof Error ? error.message : 'Unknown error',
					error instanceof Error ? error : undefined
				)
			);
		}
	}

	private async createAzureCompletion(
		model: Model,
		dto: ChatCompletionDto
	): AsyncResult<ChatCompletionResponseDto> {
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

		const url = `${this.azureEndpoint}/openai/deployments/${deployment}/chat/completions?api-version=${this.azureApiVersion}`;

		this.logger.log(`Sending request to Azure OpenAI: ${url}`);

		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'api-key': this.azureApiKey,
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
