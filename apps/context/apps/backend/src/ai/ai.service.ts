import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '../token/token.service';

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

@Injectable()
export class AiService {
	private readonly logger = new Logger(AiService.name);
	private readonly manaLlmUrl: string;

	constructor(
		private configService: ConfigService,
		private tokenService: TokenService
	) {
		this.manaLlmUrl = this.configService.get<string>('MANA_LLM_URL') || 'http://localhost:3025';
	}

	async generate(userId: string, options: GenerateOptions) {
		const model = options.model || 'ollama/gemma3:4b';

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

		// Generate text via mana-llm
		const completionText = await this.generateWithManaLlm(fullPrompt, options, model);

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
		const model = options.model || 'ollama/gemma3:4b';

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

	private async generateWithManaLlm(
		prompt: string,
		options: GenerateOptions,
		model: string
	): Promise<string> {
		const response = await fetch(`${this.manaLlmUrl}/v1/chat/completions`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model,
				messages: [
					{ role: 'system', content: 'You are a helpful assistant.' },
					{ role: 'user', content: prompt },
				],
				temperature: options.temperature || 0.7,
				max_tokens: options.maxTokens || 2000,
			}),
			signal: AbortSignal.timeout(120000),
		});

		if (!response.ok) {
			const errorText = await response.text();
			this.logger.error(`mana-llm error: ${response.status} - ${errorText}`);
			throw new BadRequestException(`LLM generation failed: ${response.status}`);
		}

		const data = await response.json();
		return data.choices?.[0]?.message?.content || '';
	}
}
