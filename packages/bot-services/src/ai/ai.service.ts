import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { LlmClient, resolveOptions } from '@manacore/shared-llm';
import type { ModelInfo } from '@manacore/shared-llm';
import {
	OllamaModel,
	ChatMessage,
	ChatOptions,
	ChatResult,
	AiServiceConfig,
	UserAiSession,
	SYSTEM_PROMPTS,
	VISION_MODELS,
	NON_CHAT_MODELS,
} from './types';

@Injectable()
export class AiService implements OnModuleInit {
	private readonly logger = new Logger(AiService.name);
	private readonly config: AiServiceConfig;
	private readonly llm: LlmClient;
	private sessions: Map<string, UserAiSession> = new Map();

	constructor(config?: Partial<AiServiceConfig>) {
		this.config = {
			baseUrl:
				config?.baseUrl ??
				process.env.MANA_LLM_URL ??
				process.env.OLLAMA_URL ??
				'http://localhost:3025',
			defaultModel: config?.defaultModel ?? process.env.OLLAMA_MODEL ?? 'gemma3:4b',
			timeout: config?.timeout ?? parseInt(process.env.OLLAMA_TIMEOUT ?? '120000'),
		};

		this.llm = new LlmClient(
			resolveOptions({
				manaLlmUrl: this.config.baseUrl,
				defaultModel: this.normalizeModel(this.config.defaultModel),
				timeout: this.config.timeout,
				maxRetries: 1,
			})
		);
	}

	async onModuleInit() {
		await this.checkConnection();
	}

	// ===== Connection =====

	async checkConnection(): Promise<boolean> {
		try {
			const health = await this.llm.health();
			const isConnected = health.status === 'healthy' || health.status === 'degraded';
			if (isConnected) {
				const providers = Object.keys(health.providers || {}).join(', ');
				this.logger.log(`mana-llm connected: ${health.status}, providers: ${providers}`);
			}
			return isConnected;
		} catch (error) {
			this.logger.error(`Failed to connect to mana-llm at ${this.config.baseUrl}:`, error);
			return false;
		}
	}

	// ===== Models =====

	async listModels(): Promise<OllamaModel[]> {
		try {
			const models = await this.llm.listModels();
			return models.map((m: ModelInfo) => ({
				name: m.id,
				size: 0,
				modified_at: new Date(m.created * 1000).toISOString(),
			}));
		} catch (error) {
			this.logger.error('Failed to list models:', error);
			return [];
		}
	}

	async getChatModels(): Promise<OllamaModel[]> {
		const models = await this.listModels();
		return models.filter((m) => !NON_CHAT_MODELS.includes(m.name));
	}

	async getVisionModels(): Promise<OllamaModel[]> {
		const models = await this.listModels();
		return models.filter((m) => VISION_MODELS.some((v) => m.name.includes(v)));
	}

	getDefaultModel(): string {
		return this.config.defaultModel;
	}

	// ===== Chat =====

	async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResult> {
		const model = options?.model ?? this.config.defaultModel;
		const normalizedModel = this.normalizeModel(model);

		const result = await this.llm.chatMessages(
			messages.map((m) => ({
				role: m.role,
				content: m.content,
			})),
			{
				model: normalizedModel,
				temperature: options?.temperature,
				maxTokens: options?.maxTokens,
			}
		);

		const meta = {
			model,
			evalCount: result.usage.completion_tokens,
			evalDuration: undefined as number | undefined,
			tokensPerSecond: undefined as number | undefined,
		};

		if (meta.evalCount && result.latencyMs > 0) {
			meta.tokensPerSecond = (meta.evalCount / result.latencyMs) * 1000;
			this.logger.debug(
				`Generated ${meta.evalCount} tokens at ${meta.tokensPerSecond.toFixed(1)} t/s`
			);
		}

		return {
			content: result.content,
			meta,
		};
	}

	async chatSimple(userId: string, message: string, options?: ChatOptions): Promise<string> {
		const session = this.getSession(userId);

		// Add user message to history
		session.history.push({ role: 'user', content: message });

		// Keep only last 10 messages
		if (session.history.length > 10) {
			session.history = session.history.slice(-10);
		}

		// Build messages with system prompt
		const messages: ChatMessage[] = [
			{ role: 'system', content: options?.systemPrompt ?? session.systemPrompt },
			...session.history,
		];

		const result = await this.chat(messages, {
			...options,
			model: options?.model ?? session.model,
		});

		// Add assistant response to history
		session.history.push({ role: 'assistant', content: result.content });

		return result.content;
	}

	// ===== Vision =====

	async chatWithImage(prompt: string, imageBase64: string, model?: string): Promise<ChatResult> {
		const selectedModel = model ?? this.config.defaultModel;
		const normalizedModel = this.normalizeModel(selectedModel);

		const result = await this.llm.vision(prompt, imageBase64, 'image/png', {
			model: normalizedModel,
		});

		const meta = {
			model: selectedModel,
			evalCount: result.usage.completion_tokens,
			evalDuration: undefined as number | undefined,
			tokensPerSecond: undefined as number | undefined,
		};

		if (meta.evalCount && result.latencyMs > 0) {
			meta.tokensPerSecond = (meta.evalCount / result.latencyMs) * 1000;
		}

		return {
			content: result.content,
			meta,
		};
	}

	// ===== Compare Models =====

	async compareModels(
		message: string,
		systemPrompt?: string
	): Promise<{ model: string; response: string; duration: number; error?: string }[]> {
		const models = await this.getChatModels();
		const results: { model: string; response: string; duration: number; error?: string }[] = [];

		const messages: ChatMessage[] = [
			{ role: 'system', content: systemPrompt ?? SYSTEM_PROMPTS.default },
			{ role: 'user', content: message },
		];

		for (const model of models) {
			const startTime = Date.now();
			try {
				this.logger.log(`Querying model ${model.name}...`);
				const result = await this.chat(messages, { model: model.name });
				const duration = Date.now() - startTime;
				results.push({ model: model.name, response: result.content, duration });
			} catch (error) {
				const duration = Date.now() - startTime;
				const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
				results.push({ model: model.name, response: '', duration, error: errorMessage });
			}
		}

		return results;
	}

	// ===== Session Management =====

	getSession(userId: string): UserAiSession {
		if (!this.sessions.has(userId)) {
			this.sessions.set(userId, {
				systemPrompt: SYSTEM_PROMPTS.default,
				model: this.config.defaultModel,
				history: [],
			});
		}
		return this.sessions.get(userId)!;
	}

	setSessionModel(userId: string, model: string): void {
		const session = this.getSession(userId);
		session.model = model;
		session.history = [];
	}

	setSessionSystemPrompt(userId: string, prompt: string): void {
		const session = this.getSession(userId);
		session.systemPrompt = prompt;
		session.history = [];
	}

	setSessionMode(userId: string, mode: string): boolean {
		const prompt = SYSTEM_PROMPTS[mode.toLowerCase()];
		if (!prompt) return false;

		this.setSessionSystemPrompt(userId, prompt);
		return true;
	}

	clearSessionHistory(userId: string): void {
		const session = this.getSession(userId);
		session.history = [];
	}

	setPendingImage(userId: string, url: string, mimeType: string, base64?: string): void {
		const session = this.getSession(userId);
		session.pendingImage = { url, mimeType, base64 };
	}

	getPendingImage(userId: string): UserAiSession['pendingImage'] {
		return this.getSession(userId).pendingImage;
	}

	clearPendingImage(userId: string): void {
		const session = this.getSession(userId);
		session.pendingImage = undefined;
	}

	// ===== Utilities =====

	getAvailableModes(): string[] {
		return Object.keys(SYSTEM_PROMPTS);
	}

	getCurrentMode(userId: string): string {
		const session = this.getSession(userId);
		const entry = Object.entries(SYSTEM_PROMPTS).find(([_, v]) => v === session.systemPrompt);
		return entry ? entry[0] : 'custom';
	}

	private normalizeModel(model: string): string {
		if (model.includes('/')) return model;
		return `ollama/${model}`;
	}
}
