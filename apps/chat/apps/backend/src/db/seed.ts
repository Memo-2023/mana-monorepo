/**
 * Database Seed Script
 * Seeds initial data for the chat application
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { models } from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString =
	process.env.DATABASE_URL || 'postgresql://chat:password@localhost:5432/chat';

async function seed() {
	console.log('Starting database seed...');

	const client = postgres(connectionString);
	const db = drizzle(client);

	try {
		// Check if models already exist
		const existingModels = await db.select().from(models);

		if (existingModels.length > 0) {
			console.log(`Found ${existingModels.length} existing models. Skipping seed.`);
			await client.end();
			return;
		}

		// Seed AI models
		console.log('Seeding AI models...');

		const modelData = [
			// ============================================
			// Local Ollama Models (Free, runs on Mac Mini)
			// ============================================
			{
				id: '550e8400-e29b-41d4-a716-446655440101',
				name: 'Gemma 3 4B (Lokal)',
				description: 'Schnelles lokales Modell - kostenlos, läuft auf Mac Mini',
				provider: 'ollama',
				parameters: {
					model: 'gemma3:4b',
					temperature: 0.7,
					max_tokens: 4096,
				},
				isActive: true,
				isDefault: true, // Default model - free and local
			},
			// ============================================
			// OpenRouter Models (Cloud, paid)
			// ============================================
			{
				id: '550e8400-e29b-41d4-a716-446655440201',
				name: 'Llama 3.1 8B',
				description: 'Fast & cheap - great for everyday tasks ($0.05/M tokens)',
				provider: 'openrouter',
				parameters: {
					model: 'meta-llama/llama-3.1-8b-instruct',
					temperature: 0.7,
					max_tokens: 4096,
				},
				isActive: true,
				isDefault: false,
			},
			{
				id: '550e8400-e29b-41d4-a716-446655440202',
				name: 'Llama 3.1 70B',
				description: 'Powerful open model - complex reasoning ($0.35/M tokens)',
				provider: 'openrouter',
				parameters: {
					model: 'meta-llama/llama-3.1-70b-instruct',
					temperature: 0.7,
					max_tokens: 8192,
				},
				isActive: true,
				isDefault: false,
			},
			{
				id: '550e8400-e29b-41d4-a716-446655440203',
				name: 'DeepSeek V3',
				description: 'Excellent reasoning at low cost ($0.14/M tokens)',
				provider: 'openrouter',
				parameters: {
					model: 'deepseek/deepseek-chat',
					temperature: 0.7,
					max_tokens: 8192,
				},
				isActive: true,
				isDefault: false,
			},
			{
				id: '550e8400-e29b-41d4-a716-446655440204',
				name: 'Mistral Small',
				description: 'Fast European model - good for general tasks ($0.10/M tokens)',
				provider: 'openrouter',
				parameters: {
					model: 'mistralai/mistral-small-24b-instruct-2501',
					temperature: 0.7,
					max_tokens: 4096,
				},
				isActive: true,
				isDefault: false,
			},
			{
				id: '550e8400-e29b-41d4-a716-446655440205',
				name: 'Claude 3.5 Sonnet',
				description: 'Best overall quality - coding & analysis ($3/M tokens)',
				provider: 'openrouter',
				parameters: {
					model: 'anthropic/claude-3.5-sonnet',
					temperature: 0.7,
					max_tokens: 8192,
				},
				isActive: true,
				isDefault: false,
			},
			{
				id: '550e8400-e29b-41d4-a716-446655440206',
				name: 'GPT-4o Mini',
				description: 'OpenAI fast model - balanced performance ($0.15/M tokens)',
				provider: 'openrouter',
				parameters: {
					model: 'openai/gpt-4o-mini',
					temperature: 0.7,
					max_tokens: 4096,
				},
				isActive: true,
				isDefault: false,
			},
		];

		await db.insert(models).values(modelData);

		console.log(`Seeded ${modelData.length} AI models successfully!`);

		// Log the seeded models
		const seededModels = await db.select().from(models);
		console.log('Seeded models:');
		seededModels.forEach((model) => {
			console.log(`  - ${model.name} (${model.id})`);
		});
	} catch (error) {
		console.error('Error seeding database:', error);
		throw error;
	} finally {
		await client.end();
	}
}

// Run seed
seed()
	.then(() => {
		console.log('Seed completed!');
		process.exit(0);
	})
	.catch((error) => {
		console.error('Seed failed:', error);
		process.exit(1);
	});
