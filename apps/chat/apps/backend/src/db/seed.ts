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
			// Google Gemini Models (Primary - fast & cost-effective)
			// ============================================
			{
				id: '550e8400-e29b-41d4-a716-446655440101',
				name: 'Gemini 2.5 Flash',
				description: 'Fastest & most cost-effective - ideal for everyday tasks',
				provider: 'gemini',
				parameters: {
					model: 'gemini-2.5-flash',
					temperature: 0.7,
					max_tokens: 8192,
				},
				isActive: true,
				isDefault: true, // Default model
			},
			{
				id: '550e8400-e29b-41d4-a716-446655440102',
				name: 'Gemini 2.0 Flash-Lite',
				description: 'Ultra-fast lightweight model - minimal latency',
				provider: 'gemini',
				parameters: {
					model: 'gemini-2.0-flash-lite',
					temperature: 0.7,
					max_tokens: 4096,
				},
				isActive: true,
				isDefault: false,
			},
			{
				id: '550e8400-e29b-41d4-a716-446655440103',
				name: 'Gemini 2.5 Pro',
				description: 'Most powerful Gemini - complex reasoning & analysis',
				provider: 'gemini',
				parameters: {
					model: 'gemini-2.5-pro',
					temperature: 0.7,
					max_tokens: 16384,
				},
				isActive: true,
				isDefault: false,
			},
			// ============================================
			// OpenRouter Models (Multi-provider, cost-effective)
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
			// ============================================
			// Azure OpenAI GPT-5 Family (Inactive - no deployment)
			// ============================================
			{
				id: '550e8400-e29b-41d4-a716-446655440001',
				name: 'GPT-5 Mini',
				description: 'Fast & cost-effective - best for everyday tasks',
				provider: 'azure',
				parameters: {
					temperature: 0.7,
					max_tokens: 8192,
					deployment: 'gpt-5-mini',
				},
				isActive: false,
				isDefault: false,
			},
			{
				id: '550e8400-e29b-41d4-a716-446655440002',
				name: 'GPT-5 Nano',
				description: 'Ultra-fast responses with low latency',
				provider: 'azure',
				parameters: {
					temperature: 0.7,
					max_tokens: 4096,
					deployment: 'gpt-5-nano',
				},
				isActive: false,
				isDefault: false,
			},
			{
				id: '550e8400-e29b-41d4-a716-446655440003',
				name: 'GPT-5 Chat',
				description: 'Advanced multimodal conversations with emotional intelligence',
				provider: 'azure',
				parameters: {
					temperature: 0.7,
					max_tokens: 16384,
					deployment: 'gpt-5-chat',
				},
				isActive: false,
				isDefault: false,
			},
			{
				id: '550e8400-e29b-41d4-a716-446655440004',
				name: 'GPT-5',
				description: 'Most powerful LLM - logic-heavy & multi-step tasks',
				provider: 'azure',
				parameters: {
					temperature: 0.7,
					max_tokens: 32768,
					deployment: 'gpt-5',
				},
				isActive: false,
				isDefault: false,
			},
			{
				id: '550e8400-e29b-41d4-a716-446655440005',
				name: 'GPT-5 Codex',
				description: 'Optimized for coding & front-end development',
				provider: 'azure',
				parameters: {
					temperature: 0.7,
					max_tokens: 32768,
					deployment: 'gpt-5-codex',
				},
				isActive: false,
				isDefault: false,
			},
			// O-Series Reasoning Models (Inactive - no deployment)
			{
				id: '550e8400-e29b-41d4-a716-446655440006',
				name: 'o4-mini',
				description: 'Latest reasoning model - best for STEM & code',
				provider: 'azure',
				parameters: {
					temperature: 1, // Reasoning models work best with temp=1
					max_tokens: 16384,
					deployment: 'o4-mini',
				},
				isActive: false,
				isDefault: false,
			},
			{
				id: '550e8400-e29b-41d4-a716-446655440007',
				name: 'o3',
				description: 'Advanced reasoning - 20% fewer errors than o1',
				provider: 'azure',
				parameters: {
					temperature: 1,
					max_tokens: 32768,
					deployment: 'o3',
				},
				isActive: false,
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
