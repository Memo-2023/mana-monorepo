import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface OllamaModel {
	name: string;
	size: number;
	modified_at: string;
}

@Injectable()
export class OllamaService implements OnModuleInit {
	private readonly logger = new Logger(OllamaService.name);
	private readonly baseUrl: string;
	private readonly defaultModel: string;
	private readonly timeout: number;

	constructor(private configService: ConfigService) {
		this.baseUrl = this.configService.get<string>('ollama.url') || 'http://localhost:11434';
		this.defaultModel = this.configService.get<string>('ollama.model') || 'gemma3:4b';
		this.timeout = this.configService.get<number>('ollama.timeout') || 120000;
	}

	async onModuleInit() {
		await this.checkConnection();
	}

	async checkConnection(): Promise<boolean> {
		try {
			const response = await fetch(`${this.baseUrl}/api/version`, {
				signal: AbortSignal.timeout(5000),
			});
			const data = await response.json();
			this.logger.log(`Ollama connected: v${data.version}`);
			return true;
		} catch (error) {
			this.logger.error(`Failed to connect to Ollama at ${this.baseUrl}:`, error);
			return false;
		}
	}

	async listModels(): Promise<OllamaModel[]> {
		try {
			const response = await fetch(`${this.baseUrl}/api/tags`);
			const data = await response.json();
			return data.models || [];
		} catch (error) {
			this.logger.error('Failed to list models:', error);
			return [];
		}
	}

	async chat(
		messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
		model?: string
	): Promise<string> {
		const selectedModel = model || this.defaultModel;

		try {
			const response = await fetch(`${this.baseUrl}/api/chat`, {
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
				throw new Error(`Ollama API error: ${response.status}`);
			}

			const data = await response.json();

			// Log performance metrics
			if (data.eval_count && data.eval_duration) {
				const tokensPerSec = (data.eval_count / data.eval_duration) * 1e9;
				this.logger.debug(`Generated ${data.eval_count} tokens at ${tokensPerSec.toFixed(1)} t/s`);
			}

			return data.message?.content || '';
		} catch (error) {
			if (error instanceof Error && error.name === 'TimeoutError') {
				throw new Error('Ollama Timeout - Antwort dauerte zu lange');
			}
			throw error;
		}
	}

	getDefaultModel(): string {
		return this.defaultModel;
	}

	async chatWithImage(prompt: string, imageBase64: string, model?: string): Promise<string> {
		const selectedModel = model || this.defaultModel;

		try {
			const response = await fetch(`${this.baseUrl}/api/chat`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					model: selectedModel,
					messages: [
						{
							role: 'user',
							content: prompt,
							images: [imageBase64],
						},
					],
					stream: false,
				}),
				signal: AbortSignal.timeout(this.timeout),
			});

			if (!response.ok) {
				throw new Error(`Ollama API error: ${response.status}`);
			}

			const data = await response.json();

			// Log performance metrics
			if (data.eval_count && data.eval_duration) {
				const tokensPerSec = (data.eval_count / data.eval_duration) * 1e9;
				this.logger.debug(
					`Vision: Generated ${data.eval_count} tokens at ${tokensPerSec.toFixed(1)} t/s`
				);
			}

			return data.message?.content || '';
		} catch (error) {
			if (error instanceof Error && error.name === 'TimeoutError') {
				throw new Error('Ollama Timeout - Bildanalyse dauerte zu lange');
			}
			throw error;
		}
	}
}
