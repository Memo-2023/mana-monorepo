import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '../token/token.service';

type AIProvider = 'azure' | 'google';

interface GenerateOptions {
	prompt: string;
	model?: string;
	temperature?: number;
	maxTokens?: number;
	documentId?: string;
	referencedDocuments?: { title: string; content: string }[];
}

function estimateTokens(text: string): number {
	if (!text) return 0;
	return Math.ceil(text.length / 4);
}

function getProvider(model: string): AIProvider {
	if (model.startsWith('gpt')) return 'azure';
	return 'google';
}

@Injectable()
export class AiService {
	constructor(
		private configService: ConfigService,
		private tokenService: TokenService
	) {}

	async generate(userId: string, options: GenerateOptions) {
		const model = options.model || 'gpt-4.1';
		const provider = getProvider(model);

		// Build full prompt with referenced documents
		let fullPrompt = options.prompt;
		if (options.referencedDocuments?.length) {
			fullPrompt += '\n\nReferenzierte Dokumente:\n\n';
			options.referencedDocuments.forEach((doc, i) => {
				fullPrompt += `Dokument ${i + 1} (${doc.title}):\n${doc.content || ''}\n\n`;
			});
		}

		// Check balance
		const promptTokens = estimateTokens(fullPrompt);
		const estimatedCompletion = options.maxTokens || 2000;
		const cost = await this.tokenService.calculateCost(model, promptTokens, estimatedCompletion);
		const hasEnough = await this.tokenService.hasEnoughTokens(userId, cost.appTokens);

		if (!hasEnough) {
			throw new BadRequestException('Nicht genügend Tokens. Bitte kaufe weitere Tokens.');
		}

		// Generate text
		let completionText: string;
		if (provider === 'azure') {
			completionText = await this.generateWithAzure(fullPrompt, options);
		} else {
			completionText = await this.generateWithGoogle(fullPrompt, { ...options, model });
		}

		// Calculate actual cost and log
		const actualPromptTokens = estimateTokens(fullPrompt);
		const completionTokens = estimateTokens(completionText);
		const { tokensUsed, remainingBalance } = await this.tokenService.logUsage(
			userId,
			model,
			actualPromptTokens,
			completionTokens,
			options.documentId
		);

		return {
			text: completionText,
			tokenInfo: {
				promptTokens: actualPromptTokens,
				completionTokens,
				totalTokens: actualPromptTokens + completionTokens,
				tokensUsed,
				remainingTokens: remainingBalance,
			},
		};
	}

	async estimateCost(
		userId: string,
		options: {
			prompt: string;
			model?: string;
			estimatedCompletionLength?: number;
			referencedDocuments?: { title: string; content: string }[];
		}
	) {
		const model = options.model || 'gpt-4.1';

		let totalInputTokens = estimateTokens(options.prompt);

		if (options.referencedDocuments?.length) {
			const formattingOverhead = 20 + options.referencedDocuments.length * 10;
			totalInputTokens += formattingOverhead;
			options.referencedDocuments.forEach((doc) => {
				totalInputTokens += estimateTokens(doc.content || '');
			});
		}

		const estimate = await this.tokenService.calculateCost(
			model,
			totalInputTokens,
			options.estimatedCompletionLength || 500
		);
		const balance = await this.tokenService.getBalance(userId);

		return {
			hasEnough: balance >= estimate.appTokens,
			estimate,
			balance,
		};
	}

	private async generateWithAzure(prompt: string, options: GenerateOptions): Promise<string> {
		const apiKey = this.configService.get<string>('AZURE_OPENAI_API_KEY', '');
		const endpoint = this.configService.get<string>(
			'AZURE_OPENAI_ENDPOINT',
			'https://memoroseopenai.openai.azure.com/'
		);
		const deployment = 'gpt-4.1';
		const apiVersion = '2025-01-01-preview';

		const response = await fetch(
			`${endpoint}openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'api-key': apiKey,
				},
				body: JSON.stringify({
					messages: [
						{ role: 'system', content: 'You are a helpful assistant.' },
						{ role: 'user', content: prompt },
					],
					temperature: options.temperature || 0.7,
					max_tokens: options.maxTokens || 2000,
				}),
			}
		);

		if (!response.ok) {
			throw new BadRequestException(`Azure OpenAI error: ${response.statusText}`);
		}

		const data = await response.json();
		return data.choices?.[0]?.message?.content || '';
	}

	private async generateWithGoogle(prompt: string, options: GenerateOptions): Promise<string> {
		const apiKey = this.configService.get<string>('GOOGLE_API_KEY', '');
		const model = options.model || 'gemini-pro';

		const response = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contents: [{ parts: [{ text: prompt }] }],
					generationConfig: {
						temperature: options.temperature || 0.7,
						maxOutputTokens: options.maxTokens || 2000,
					},
				}),
			}
		);

		if (!response.ok) {
			throw new BadRequestException(`Google AI error: ${response.statusText}`);
		}

		const data = await response.json();
		return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
	}
}
