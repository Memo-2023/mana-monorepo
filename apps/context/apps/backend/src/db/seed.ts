import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { modelPrices } from './schema/model-prices.schema';

dotenv.config();

async function seed() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error('DATABASE_URL environment variable is not set');
	}

	console.log('\ud83c\udf31 Seeding Context database...');

	const connection = postgres(databaseUrl, { max: 1 });
	const db = drizzle(connection);

	try {
		// Seed model prices
		const models = [
			{
				modelName: 'gpt-4.1',
				inputPricePer1kTokens: '0.010000',
				outputPricePer1kTokens: '0.030000',
				tokensPerDollar: 50000,
			},
			{
				modelName: 'gemini-pro',
				inputPricePer1kTokens: '0.000500',
				outputPricePer1kTokens: '0.001500',
				tokensPerDollar: 50000,
			},
			{
				modelName: 'gemini-flash',
				inputPricePer1kTokens: '0.000100',
				outputPricePer1kTokens: '0.000400',
				tokensPerDollar: 50000,
			},
		];

		for (const model of models) {
			await db
				.insert(modelPrices)
				.values(model)
				.onConflictDoUpdate({
					target: modelPrices.modelName,
					set: {
						inputPricePer1kTokens: model.inputPricePer1kTokens,
						outputPricePer1kTokens: model.outputPricePer1kTokens,
						tokensPerDollar: model.tokensPerDollar,
						updatedAt: new Date(),
					},
				});
			console.log(`  \u2705 ${model.modelName}`);
		}

		console.log('\n\ud83c\udf89 Seed completed successfully!');
	} catch (error) {
		console.error('\u274c Seed failed:', error);
		throw error;
	} finally {
		await connection.end();
	}
}

seed()
	.then(() => process.exit(0))
	.catch(() => process.exit(1));
