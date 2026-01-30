/**
 * Add Local Models Script
 * Adds new local Ollama models to existing database (upsert)
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { models } from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString =
	process.env.DATABASE_URL || 'postgresql://chat:password@localhost:5432/chat';

async function addLocalModels() {
	console.log('Adding local Ollama models...');

	const client = postgres(connectionString);
	const db = drizzle(client);

	// New local models to add
	const newModels = [
		{
			id: '550e8400-e29b-41d4-a716-446655440102',
			name: 'Qwen2.5 Coder 7B (Lokal)',
			description: 'State-of-the-Art Code-Modell - 92.7% HumanEval, kostenlos',
			provider: 'ollama',
			parameters: {
				model: 'qwen2.5-coder:7b',
				temperature: 0.3,
				max_tokens: 8192,
			},
			isActive: true,
			isDefault: false,
		},
		{
			id: '550e8400-e29b-41d4-a716-446655440103',
			name: 'LLaVA 7B Vision (Lokal)',
			description: 'Vision-Modell für Bildanalyse - kann Screenshots/Bilder verstehen',
			provider: 'ollama',
			parameters: {
				model: 'llava:7b',
				temperature: 0.7,
				max_tokens: 4096,
			},
			isActive: true,
			isDefault: false,
		},
		{
			id: '550e8400-e29b-41d4-a716-446655440104',
			name: 'Qwen3 VL 4B (Lokal)',
			description: 'Kompaktes Vision-Language Modell - schnelle Bildanalyse',
			provider: 'ollama',
			parameters: {
				model: 'qwen3-vl:4b',
				temperature: 0.7,
				max_tokens: 4096,
			},
			isActive: true,
			isDefault: false,
		},
		{
			id: '550e8400-e29b-41d4-a716-446655440105',
			name: 'DeepSeek OCR (Lokal)',
			description: 'Spezialisiert auf Texterkennung in Bildern und Dokumenten',
			provider: 'ollama',
			parameters: {
				model: 'deepseek-ocr:latest',
				temperature: 0.3,
				max_tokens: 4096,
			},
			isActive: true,
			isDefault: false,
		},
		{
			id: '550e8400-e29b-41d4-a716-446655440106',
			name: 'Phi 3.5 (Lokal)',
			description: 'Microsoft Phi 3.5 - kompakt und effizient',
			provider: 'ollama',
			parameters: {
				model: 'phi3.5:latest',
				temperature: 0.7,
				max_tokens: 4096,
			},
			isActive: true,
			isDefault: false,
		},
		{
			id: '550e8400-e29b-41d4-a716-446655440107',
			name: 'Ministral 3B (Lokal)',
			description: 'Mistral Mini - sehr schnell, gut für einfache Aufgaben',
			provider: 'ollama',
			parameters: {
				model: 'ministral-3:3b',
				temperature: 0.7,
				max_tokens: 4096,
			},
			isActive: true,
			isDefault: false,
		},
	];

	try {
		let added = 0;
		let updated = 0;

		for (const model of newModels) {
			// Check if model exists
			const existing = await db.select().from(models).where(eq(models.id, model.id));

			if (existing.length > 0) {
				// Update existing
				await db.update(models).set(model).where(eq(models.id, model.id));
				console.log(`  Updated: ${model.name}`);
				updated++;
			} else {
				// Insert new
				await db.insert(models).values(model);
				console.log(`  Added: ${model.name}`);
				added++;
			}
		}

		console.log(`\nDone! Added: ${added}, Updated: ${updated}`);

		// Show all models
		const allModels = await db.select().from(models);
		console.log(`\nTotal models in database: ${allModels.length}`);
		console.log('\nLocal models:');
		allModels.filter((m) => m.provider === 'ollama').forEach((m) => console.log(`  - ${m.name}`));
	} catch (error) {
		console.error('Error:', error);
		throw error;
	} finally {
		await client.end();
	}
}

addLocalModels()
	.then(() => process.exit(0))
	.catch(() => process.exit(1));
