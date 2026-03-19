import { Injectable, Inject } from '@nestjs/common';
import { eq, and, gte, desc } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../db/database.module';
import { Database } from '../db/connection';
import { userTokens } from '../db/schema/user-tokens.schema';
import { tokenTransactions } from '../db/schema/token-transactions.schema';
import { modelPrices } from '../db/schema/model-prices.schema';
import type { TokenTransaction } from '../db/schema/token-transactions.schema';
import type { ModelPrice } from '../db/schema/model-prices.schema';

export interface TokenCostEstimate {
	inputTokens: number;
	outputTokens: number;
	totalTokens: number;
	costUsd: number;
	appTokens: number;
}

export interface TokenUsageStats {
	totalUsed: number;
	byModel: Record<string, number>;
	byDate: Record<string, number>;
}

@Injectable()
export class TokenService {
	constructor(@Inject(DATABASE_CONNECTION) private db: Database) {}

	async getBalance(userId: string): Promise<number> {
		const result = await this.db.select().from(userTokens).where(eq(userTokens.userId, userId));

		if (result.length === 0) {
			// Create user token record with default balance
			await this.db.insert(userTokens).values({
				userId,
				tokenBalance: 1000,
				monthlyFreeTokens: 1000,
			});
			return 1000;
		}

		return result[0].tokenBalance || 0;
	}

	async hasEnoughTokens(userId: string, required: number): Promise<boolean> {
		const balance = await this.getBalance(userId);
		return balance >= required;
	}

	async getModelPrice(modelName: string): Promise<ModelPrice | null> {
		const result = await this.db
			.select()
			.from(modelPrices)
			.where(eq(modelPrices.modelName, modelName));
		return result[0] || null;
	}

	async getModelPrices(): Promise<ModelPrice[]> {
		return this.db.select().from(modelPrices);
	}

	async calculateCost(
		model: string,
		promptTokens: number,
		completionTokens: number
	): Promise<TokenCostEstimate> {
		let inputPricePer1k = 0.01;
		let outputPricePer1k = 0.03;
		let tokensPerDollar = 50000;

		const price = await this.getModelPrice(model);
		if (price) {
			inputPricePer1k = parseFloat(price.inputPricePer1kTokens);
			outputPricePer1k = parseFloat(price.outputPricePer1kTokens);
			tokensPerDollar = price.tokensPerDollar;
		}

		const inputCost = (promptTokens / 1000) * inputPricePer1k;
		const outputCost = (completionTokens / 1000) * outputPricePer1k;
		const totalCostUsd = inputCost + outputCost;
		const appTokens = Math.max(1, Math.ceil(totalCostUsd * tokensPerDollar));

		return {
			inputTokens: promptTokens,
			outputTokens: completionTokens,
			totalTokens: promptTokens + completionTokens,
			costUsd: totalCostUsd,
			appTokens,
		};
	}

	async logUsage(
		userId: string,
		model: string,
		promptTokens: number,
		completionTokens: number,
		documentId?: string
	): Promise<{ tokensUsed: number; remainingBalance: number }> {
		const cost = await this.calculateCost(model, promptTokens, completionTokens);

		// Deduct tokens
		const currentBalance = await this.getBalance(userId);
		const newBalance = Math.max(0, currentBalance - cost.appTokens);

		await this.db
			.update(userTokens)
			.set({
				tokenBalance: newBalance,
				updatedAt: new Date(),
			})
			.where(eq(userTokens.userId, userId));

		// Log transaction
		await this.db.insert(tokenTransactions).values({
			userId,
			amount: -cost.appTokens,
			transactionType: 'usage',
			modelUsed: model,
			promptTokens,
			completionTokens,
			totalTokens: promptTokens + completionTokens,
			costUsd: cost.costUsd.toFixed(6),
			documentId: documentId || null,
		});

		return { tokensUsed: cost.appTokens, remainingBalance: newBalance };
	}

	async getUsageStats(
		userId: string,
		timeframe: 'day' | 'week' | 'month' | 'year'
	): Promise<TokenUsageStats> {
		const daysMap = { day: 1, week: 7, month: 30, year: 365 };
		const days = daysMap[timeframe];

		const since = new Date();
		since.setDate(since.getDate() - days);

		const transactions = await this.db
			.select()
			.from(tokenTransactions)
			.where(
				and(
					eq(tokenTransactions.userId, userId),
					eq(tokenTransactions.transactionType, 'usage'),
					gte(tokenTransactions.createdAt, since)
				)
			)
			.orderBy(desc(tokenTransactions.createdAt));

		const stats: TokenUsageStats = { totalUsed: 0, byModel: {}, byDate: {} };

		transactions.forEach((t) => {
			stats.totalUsed += Math.abs(t.amount);
			if (t.modelUsed) {
				stats.byModel[t.modelUsed] = (stats.byModel[t.modelUsed] || 0) + Math.abs(t.amount);
			}
			const date = new Date(t.createdAt).toLocaleDateString('de-DE');
			stats.byDate[date] = (stats.byDate[date] || 0) + Math.abs(t.amount);
		});

		return stats;
	}

	async getTransactions(userId: string, limit = 20, offset = 0): Promise<TokenTransaction[]> {
		return this.db
			.select()
			.from(tokenTransactions)
			.where(eq(tokenTransactions.userId, userId))
			.orderBy(desc(tokenTransactions.createdAt))
			.limit(limit)
			.offset(offset);
	}
}
