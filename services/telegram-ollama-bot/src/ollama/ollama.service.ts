import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface LlmModel {
	id: string;
	owned_by: string;
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

@Injectable()
export class OllamaService implements OnModuleInit {
	private readonly logger = new Logger(OllamaService.name);
	private readonly baseUrl: string;
	private readonly defaultModel: string;
	private readonly timeout: number;

	constructor(private configService: ConfigService) {
		this.baseUrl = this.configService.get<string>('llm.url') || 'http://localhost:3025';
		this.defaultModel = this.configService.get<string>('llm.model') || 'ollama/gemma3:4b';
		this.timeout = this.configService.get<number>('llm.timeout') || 120000;
	}

	async onModuleInit() {
		await this.checkConnection();
	}

	async checkConnection(): Promise<boolean> {
		try {
			const response = await fetch(`${this.baseUrl}/health`, {
				signal: AbortSignal.timeout(5000),
			});
			const data = await response.json();
			this.logger.log(
				`mana-llm connected: ${data.status}, providers: ${Object.keys(data.providers || {}).join(', ')}`
			);
			return data.status === 'healthy' || data.status === 'degraded';
		} catch (error) {
			this.logger.error(`Failed to connect to mana-llm at ${this.baseUrl}:`, error);
			return false;
		}
	}

	async listModels(): Promise<{ name: string; size: number; modified_at: string }[]> {
		try {
			const response = await fetch(`${this.baseUrl}/v1/models`);
			const data = await response.json();

			// Convert OpenAI format to legacy Ollama format for compatibility
			return (data.data || []).map((m: LlmModel) => ({
				name: m.id,
				size: 0,
				modified_at: new Date().toISOString(),
			}));
		} catch (error) {
			this.logger.error('Failed to list models:', error);
			return [];
		}
	}

	async generate(prompt: string, systemPrompt?: string, model?: string): Promise<string> {
		const selectedModel = model ? this.normalizeModel(model) : this.defaultModel;

		// Convert generate to chat format
		const messages: { role: 'user' | 'assistant' | 'system'; content: string }[] = [];
		if (systemPrompt) {
			messages.push({ role: 'system', content: systemPrompt });
		}
		messages.push({ role: 'user', content: prompt });

		try {
			const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					model: selectedModel,
					messages,
					stream: false,
				}),
				signal: AbortSignal.timeout(this.timeout),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`mana-llm API error: ${response.status} - ${errorText}`);
			}

			const data: ChatCompletionResponse = await response.json();

			// Log performance metrics
			if (data.usage) {
				this.logger.debug(
					`Generated ${data.usage.completion_tokens} tokens (total: ${data.usage.total_tokens})`
				);
			}

			return data.choices[0]?.message?.content || '';
		} catch (error) {
			if (error instanceof Error && error.name === 'TimeoutError') {
				throw new Error('LLM Timeout - Antwort dauerte zu lange');
			}
			throw error;
		}
	}

	async chat(
		messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
		model?: string
	): Promise<string> {
		const selectedModel = model ? this.normalizeModel(model) : this.defaultModel;

		try {
			const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					model: selectedModel,
					messages,
					stream: false,
				}),
				signal: AbortSignal.timeout(this.timeout),
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`mana-llm API error: ${response.status} - ${errorText}`);
			}

			const data: ChatCompletionResponse = await response.json();

			if (data.usage) {
				this.logger.debug(
					`Generated ${data.usage.completion_tokens} tokens (total: ${data.usage.total_tokens})`
				);
			}

			return data.choices[0]?.message?.content || '';
		} catch (error) {
			if (error instanceof Error && error.name === 'TimeoutError') {
				throw new Error('LLM Timeout - Antwort dauerte zu lange');
			}
			throw error;
		}
	}

	getDefaultModel(): string {
		return this.defaultModel;
	}

	/**
	 * Normalize model name to include provider prefix if missing.
	 */
	private normalizeModel(model: string): string {
		if (model.includes('/')) {
			return model;
		}
		return `ollama/${model}`;
	}
}
