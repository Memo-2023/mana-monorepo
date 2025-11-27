import * as dotenv from 'dotenv';
import { getDb, closeConnection } from './connection';
import { models } from './schema';

dotenv.config();

const defaultModels = [
	{
		name: 'sdxl',
		displayName: 'Stable Diffusion XL',
		description: 'High-quality image generation with excellent prompt adherence',
		replicateId: 'stability-ai/sdxl',
		version: '39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
		defaultWidth: 1024,
		defaultHeight: 1024,
		defaultSteps: 25,
		defaultGuidanceScale: 7.5,
		supportsNegativePrompt: true,
		supportsImg2Img: true,
		supportsSeed: true,
		isActive: true,
		isDefault: true,
		sortOrder: 0,
		estimatedTimeSeconds: 15,
	},
	{
		name: 'flux-schnell',
		displayName: 'FLUX Schnell',
		description: 'Fast image generation with good quality',
		replicateId: 'black-forest-labs/flux-schnell',
		version: 'f2ab8a5bfe79f02f0789a146cf5e73d2a4ff2684a98c2b303d1e1ff3814271db',
		defaultWidth: 1024,
		defaultHeight: 1024,
		defaultSteps: 4,
		defaultGuidanceScale: 0,
		supportsNegativePrompt: false,
		supportsImg2Img: false,
		supportsSeed: true,
		isActive: true,
		isDefault: false,
		sortOrder: 1,
		estimatedTimeSeconds: 5,
	},
	{
		name: 'flux-pro',
		displayName: 'FLUX Pro',
		description: 'Professional quality image generation',
		replicateId: 'black-forest-labs/flux-pro',
		version: '7d6fbcd3da3f4e1c1c08d8ab0e7a4c2e0e5e3c9e8f8e8e8e8e8e8e8e8e8e8e8e',
		defaultWidth: 1024,
		defaultHeight: 1024,
		defaultSteps: 25,
		defaultGuidanceScale: 3.5,
		supportsNegativePrompt: false,
		supportsImg2Img: false,
		supportsSeed: true,
		isActive: true,
		isDefault: false,
		sortOrder: 2,
		estimatedTimeSeconds: 20,
	},
];

async function seed() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error('DATABASE_URL is not set');
	}

	const db = getDb(databaseUrl);

	console.log('Seeding models...');

	for (const model of defaultModels) {
		try {
			await db.insert(models).values(model).onConflictDoNothing();
			console.log(`  - ${model.displayName}`);
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
