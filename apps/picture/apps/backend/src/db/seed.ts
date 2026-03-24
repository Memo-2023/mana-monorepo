import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
import { getDb, closeConnection } from './connection';
import { models } from './schema';

dotenv.config();

const defaultModels = [
	{
		name: 'flux-schnell',
		displayName: 'FLUX Schnell',
		description:
			'Schnellstes Modell von Black Forest Labs - generiert hochwertige Bilder in nur 1-4 Schritten. Ideal für schnelle Iterationen.',
		replicateId: 'black-forest-labs/flux-schnell',
		version: 'c846a69991daf4c0e5d016514849d14ee5b2e6846ce6b9d6f21369e564cfe51e',
		defaultWidth: 1024,
		defaultHeight: 1024,
		defaultSteps: 4,
		defaultGuidanceScale: 0,
		minWidth: 256,
		minHeight: 256,
		maxWidth: 1440,
		maxHeight: 1440,
		maxSteps: 4,
		supportsNegativePrompt: false,
		supportsImg2Img: false,
		supportsSeed: true,
		isActive: true,
		isDefault: true,
		sortOrder: 0,
		costPerGeneration: 0.003,
		estimatedTimeSeconds: 3,
	},
	{
		name: 'seedream-3',
		displayName: 'Seedream 3',
		description:
			'ByteDances hochauflösendes Modell mit nativer 2K-Ausgabe. Exzellente Text-Darstellung und fotorealistische Portraits.',
		replicateId: 'bytedance/seedream-3',
		version: 'ed344813bc9f4996be6de4febd8b9c14c7849ad7b21ab047572e3620ee374ee7',
		defaultWidth: 2048,
		defaultHeight: 2048,
		defaultSteps: 1, // Model handles steps internally
		defaultGuidanceScale: 2.5,
		minWidth: 512,
		minHeight: 512,
		maxWidth: 2048,
		maxHeight: 2048,
		maxSteps: 1,
		supportsNegativePrompt: false,
		supportsImg2Img: false,
		supportsSeed: true,
		isActive: true,
		isDefault: false,
		sortOrder: 1,
		costPerGeneration: 0.03,
		estimatedTimeSeconds: 5,
	},
	{
		name: 'nano-banana',
		displayName: 'Nano Banana',
		description:
			'Googles multimodales Gemini-Modell für Bildgenerierung und -bearbeitung. Beste Textdarstellung in Bildern und Charakter-Konsistenz.',
		replicateId: 'google/nano-banana',
		version: 'd05a591283da31be3eea28d5634ef9e26989b351718b6489bd308426ebd0a3e8',
		defaultWidth: 1024,
		defaultHeight: 1024,
		defaultSteps: 1, // Model handles steps internally
		defaultGuidanceScale: 0,
		minWidth: 512,
		minHeight: 512,
		maxWidth: 2048,
		maxHeight: 2048,
		maxSteps: 1,
		supportsNegativePrompt: false,
		supportsImg2Img: true, // Supports image editing
		supportsSeed: false, // No seed parameter exposed
		isActive: true,
		isDefault: false,
		sortOrder: 2,
		costPerGeneration: 0.039,
		estimatedTimeSeconds: 3,
	},
	{
		name: 'flux2-klein-local',
		displayName: 'FLUX.2 Klein (Lokal)',
		description:
			'Lokales Bildgenerierungsmodell auf eigenem Server in Deutschland. Keine Cloud-API, keine Kosten, volle Datenkontrolle. ~0.8s pro Bild.',
		replicateId: 'local/flux2-klein',
		version: null,
		defaultWidth: 1024,
		defaultHeight: 1024,
		defaultSteps: 4,
		defaultGuidanceScale: 0,
		minWidth: 256,
		minHeight: 256,
		maxWidth: 2048,
		maxHeight: 2048,
		maxSteps: 8,
		supportsNegativePrompt: false,
		supportsImg2Img: false,
		supportsSeed: true,
		isActive: true,
		isDefault: false,
		sortOrder: -1, // Show first (local = preferred)
		costPerGeneration: 0,
		estimatedTimeSeconds: 1,
	},
];

async function seed() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error('DATABASE_URL is not set');
	}

	const db = getDb(databaseUrl);

	console.log('Clearing old models...');
	// Remove old models that are not in the new list
	const oldModelNames = ['sdxl', 'flux-pro'];
	for (const name of oldModelNames) {
		try {
			await db.delete(models).where(eq(models.name, name));
			console.log(`  - Removed: ${name}`);
		} catch (error) {
			console.error(`  - Error removing ${name}:`, error);
		}
	}

	console.log('Seeding models...');

	for (const model of defaultModels) {
		try {
			// Check if model exists
			const existing = await db.select().from(models).where(eq(models.name, model.name));
			if (existing.length > 0) {
				// Update existing
				await db
					.update(models)
					.set({
						displayName: model.displayName,
						description: model.description,
						replicateId: model.replicateId,
						version: model.version,
						defaultWidth: model.defaultWidth,
						defaultHeight: model.defaultHeight,
						defaultSteps: model.defaultSteps,
						defaultGuidanceScale: model.defaultGuidanceScale,
						minWidth: model.minWidth,
						minHeight: model.minHeight,
						maxWidth: model.maxWidth,
						maxHeight: model.maxHeight,
						maxSteps: model.maxSteps,
						supportsNegativePrompt: model.supportsNegativePrompt,
						supportsImg2Img: model.supportsImg2Img,
						supportsSeed: model.supportsSeed,
						isActive: model.isActive,
						isDefault: model.isDefault,
						sortOrder: model.sortOrder,
						costPerGeneration: model.costPerGeneration,
						estimatedTimeSeconds: model.estimatedTimeSeconds,
					})
					.where(eq(models.name, model.name));
				console.log(`  - Updated: ${model.displayName}`);
			} else {
				// Insert new
				await db.insert(models).values(model);
				console.log(`  - Added: ${model.displayName}`);
			}
		} catch (error) {
			console.error(`  - Error seeding ${model.displayName}:`, error);
		}
	}

	console.log('Seeding complete!');
	await closeConnection();
}

seed().catch((error) => {
	console.error('Seed failed:', error);
	process.exit(1);
});
