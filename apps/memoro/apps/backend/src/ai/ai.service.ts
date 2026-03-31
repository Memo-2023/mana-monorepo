import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	GEMINI_DEFAULT,
	AZURE_DEFAULT,
	type GeminiConfig,
	type AzureOpenAIConfig,
	type GenerateOptions,
} from './ai-model.config';

@Injectable()
export class AiService {
	private readonly logger = new Logger(AiService.name);
	private readonly geminiApiKey: string;
	private readonly azureApiKey: string;

	constructor(private configService: ConfigService) {
		this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY', '');
		this.azureApiKey = this.configService.get<string>('AZURE_OPENAI_KEY', '');
	}

	/**
	 * Generiert Text mit Gemini (Primary) → Azure (Fallback).
	 * Gibt den rohen Text-Content zurück.
	 */
	async generateText(
		prompt: string,
		options?: GenerateOptions & { systemInstruction?: string }
	): Promise<string> {
		// Primary: Gemini
		if (this.geminiApiKey) {
			const result = await this.callGemini(prompt, this.geminiApiKey, options);
			if (result !== null) return result;
			this.logger.warn('Gemini failed, falling back to Azure OpenAI');
		} else {
			this.logger.warn('No Gemini API key, using Azure OpenAI directly');
		}

		// Fallback: Azure
		if (!this.azureApiKey) {
			throw new Error('No AI provider available: both Gemini and Azure keys missing');
		}
		const result = await this.callAzure(prompt, options);
		if (result !== null) return result;

		throw new Error('All AI providers failed');
	}

	private async callGemini(
		prompt: string,
		apiKey: string,
		options?: GenerateOptions & { systemInstruction?: string }
	): Promise<string | null> {
		const config: GeminiConfig = {
			...GEMINI_DEFAULT,
			temperature: options?.temperature ?? GEMINI_DEFAULT.temperature,
			maxOutputTokens: options?.maxTokens ?? GEMINI_DEFAULT.maxOutputTokens,
		};

		try {
			const url = `${config.endpoint}/${config.model}:generateContent?key=${apiKey}`;
			const body: any = {
				contents: [{ parts: [{ text: prompt }] }],
				generationConfig: {
					temperature: config.temperature,
					maxOutputTokens: config.maxOutputTokens,
				},
			};

			if (options?.systemInstruction) {
				body.systemInstruction = {
					parts: [{ text: options.systemInstruction }],
				};
			}

			const start = Date.now();
			const response = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				const errorText = await response.text();
				this.logger.error(`Gemini API error (${response.status}): ${errorText}`);
				return null;
			}

			const data = await response.json();
			const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
			this.logger.debug(
				`Gemini ${config.model} responded in ${Date.now() - start}ms (${content.length} chars)`
			);
			return content || null;
		} catch (error) {
			this.logger.error(`Gemini call failed: ${error instanceof Error ? error.message : error}`);
			return null;
		}
	}

	private async callAzure(prompt: string, options?: GenerateOptions): Promise<string | null> {
		const config: AzureOpenAIConfig = {
			...AZURE_DEFAULT,
			temperature: options?.temperature ?? AZURE_DEFAULT.temperature,
			maxTokens: options?.maxTokens ?? AZURE_DEFAULT.maxTokens,
		};

		try {
			const url = `${config.endpoint}/openai/deployments/${config.deployment}/chat/completions?api-version=${config.apiVersion}`;
			const start = Date.now();
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'api-key': this.azureApiKey,
				},
				body: JSON.stringify({
					messages: [{ role: 'user', content: prompt }],
					max_tokens: config.maxTokens,
					temperature: config.temperature,
				}),
			});

			if (!response.ok) {
				const errorText = await response.text();
				this.logger.error(`Azure OpenAI error (${response.status}): ${errorText}`);
				return null;
			}

			const data = await response.json();
			const content = data.choices?.[0]?.message?.content?.trim() || '';
			this.logger.debug(
				`Azure ${config.deployment} responded in ${Date.now() - start}ms (${content.length} chars)`
			);
			return content || null;
		} catch (error) {
			this.logger.error(`Azure call failed: ${error instanceof Error ? error.message : error}`);
			return null;
		}
	}
}
