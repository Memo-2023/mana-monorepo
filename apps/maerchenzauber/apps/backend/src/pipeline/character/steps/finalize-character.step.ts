import { PipelineStep } from '../../core/pipeline.types';
import { CharacterCreditOutput, CharacterFinalOutput } from '../types/character-pipeline.types';

export const finalizeCharacterStep: PipelineStep<CharacterCreditOutput, CharacterFinalOutput> = {
	name: 'finalize-character',
	category: 'character',
	description: 'Finalizes character creation and prepares response',

	execute: async (input, context) => {
		const totalDuration = context?.logs.reduce((sum, log) => sum + (log.duration || 0), 0) || 0;

		const pipelineSteps = context?.logs.map((log) => log.stepName) || [];

		return {
			success: true,
			character: {
				id: input.characterId,
				name: input.sanitizedName,
				description: input.validatedDescription,
				imageUrl: input.imageUrl,
				age: input.age,
				personality: input.personality,
				voice: input.voice,
			},
			metadata: {
				creditsUsed: input.creditsDeducted,
				generationTime: totalDuration,
				pipelineSteps,
			},
		};
	},
};
