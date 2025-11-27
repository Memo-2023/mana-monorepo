import { PipelineStep } from '../../core/pipeline.types';
import {
	CharacterCreationInput,
	CharacterValidationOutput,
} from '../types/character-pipeline.types';

export const validateCharacterStep: PipelineStep<
	CharacterCreationInput,
	CharacterValidationOutput
> = {
	name: 'validate-character',
	category: 'character',
	description: 'Validates and sanitizes character input data',

	validate: (input) => {
		const errors: string[] = [];

		if (!input.name || input.name.trim().length < 2) {
			errors.push('Character name must be at least 2 characters');
		}

		if (!input.description || input.description.trim().length < 10) {
			errors.push('Character description must be at least 10 characters');
		}

		if (input.name && input.name.length > 50) {
			errors.push('Character name must be less than 50 characters');
		}

		if (input.description && input.description.length > 1000) {
			errors.push('Character description must be less than 1000 characters');
		}

		if (!input.userId) {
			errors.push('User ID is required');
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	},

	execute: async (input) => {
		// Sanitize name: remove special characters, trim
		const sanitizedName = input.name
			.trim()
			.replace(/[^a-zA-Z0-9\s-]/g, '')
			.replace(/\s+/g, ' ')
			.substring(0, 50);

		// Validate and enhance description
		const validatedDescription = input.description.trim().replace(/\s+/g, ' ').substring(0, 1000);

		// Calculate estimated credits (10 credits for character creation)
		const estimatedCredits = 10;

		return {
			...input,
			sanitizedName,
			validatedDescription,
			estimatedCredits,
		};
	},

	rollback: async (input, error, context) => {
		console.log(`[Rollback] validate-character: Nothing to rollback`);
	},
};
