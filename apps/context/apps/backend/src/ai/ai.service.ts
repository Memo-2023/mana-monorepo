import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { LlmClientService } from '@manacore/shared-llm';
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

	constructor(
		private readonly llm: LlmClientService,
		private tokenService: TokenService
	) {}

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
		const result = await this.llm.chat(fullPrompt, {
			model,
			systemPrompt: 'You are a helpful assistant.',
			temperature: options.temperature || 0.7,
			maxTokens: options.maxTokens || 2000,
		});

		// Use actual token counts from response when available, fall back to estimates
		const actualPromptTokens = result.usage.prompt_tokens || estimateTokens(fullPrompt);
		const completionTokens = result.usage.completion_tokens || estimateTokens(result.content);
		const { tokensUsed, remainingBalance } = await this.tokenService.logUsage(
			userId,
			model,
			actualPromptTokens,
			completionTokens,
			options.documentId
		);

		return {
			text: result.content,
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
}
