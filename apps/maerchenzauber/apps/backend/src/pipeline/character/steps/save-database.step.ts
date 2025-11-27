import { PipelineStep } from '../../core/pipeline.types';
import { CharacterImageOutput, CharacterDatabaseOutput } from '../types/character-pipeline.types';

// Mock database save - replace with actual Supabase call
async function saveCharacterToDatabase(character: any): Promise<string> {
	// In real implementation:
	// const { data, error } = await supabase
	//   .from('characters')
	//   .insert(character)
	//   .select()
	//   .single();

	return `char_${Date.now()}`;
}

export const saveToDatabase: PipelineStep<CharacterImageOutput, CharacterDatabaseOutput> = {
	name: 'save-to-database',
	category: 'character',
	description: 'Saves character data to the database',
	timeout: 5000,

	execute: async (input, context) => {
		const now = new Date();

		const characterData = {
			user_id: input.userId,
			name: input.sanitizedName,
			description: input.validatedDescription,
			image_url: input.imageUrl,
			image_id: input.imageId,
			age: input.age,
			personality: input.personality,
			voice: input.voice,
			language: input.language || 'en',
			metadata: {
				imagePrompt: input.imageGenerationPrompt,
				stylePrompt: input.characterStylePrompt,
				imageDimensions: input.imageDimensions,
			},
			created_at: now,
			updated_at: now,
		};

		try {
			const characterId = await saveCharacterToDatabase(characterData);

			return {
				...input,
				characterId,
				createdAt: now,
				updatedAt: now,
			};
		} catch (error) {
			throw new Error(`Failed to save character to database: ${(error as Error).message}`);
		}
	},

	rollback: async (input, error, context) => {
		if ('characterId' in input && input.characterId) {
			console.log(`[Rollback] save-to-database: Deleting character ${input.characterId}`);
			// await supabase.from('characters').delete().eq('id', input.characterId);
		}
	},
};
