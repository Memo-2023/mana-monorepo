import { PipelineStep } from '../../core/pipeline.types';
import {
	CharacterValidationOutput,
	CharacterPromptOutput,
} from '../types/character-pipeline.types';

export const generatePromptStep: PipelineStep<CharacterValidationOutput, CharacterPromptOutput> = {
	name: 'generate-prompt',
	category: 'character',
	description: 'Generates optimized prompts for character image generation',
	timeout: 5000,

	execute: async (input) => {
		// Build character style based on description
		const characterStyle = determineStyle(input.validatedDescription);

		// Generate main image prompt
		const imageGenerationPrompt = buildImagePrompt(
			input.sanitizedName,
			input.validatedDescription,
			input.age,
			input.personality,
			characterStyle
		);

		// Generate negative prompt to avoid unwanted elements
		const negativePrompt = buildNegativePrompt();

		// Add character style prompt for consistency
		const characterStylePrompt = buildStylePrompt(characterStyle);

		return {
			...input,
			imageGenerationPrompt,
			characterStylePrompt,
			negativePrompt,
		};
	},
};

function determineStyle(description: string): string {
	const lowerDesc = description.toLowerCase();

	if (lowerDesc.includes('realistic') || lowerDesc.includes('photo')) {
		return 'photorealistic';
	}
	if (lowerDesc.includes('anime') || lowerDesc.includes('manga')) {
		return 'anime';
	}
	if (lowerDesc.includes('cartoon') || lowerDesc.includes('pixar')) {
		return 'cartoon';
	}
	if (lowerDesc.includes('watercolor') || lowerDesc.includes('painted')) {
		return 'watercolor';
	}

	// Default style for children's stories
	return 'whimsical illustration';
}

function buildImagePrompt(
	name: string,
	description: string,
	age?: string,
	personality?: string,
	style?: string
): string {
	const parts = [
		`A character named ${name}`,
		description,
		age ? `${age} years old` : '',
		personality ? `with ${personality} personality` : '',
		style || 'whimsical illustration style',
		'child-friendly',
		'colorful',
		'high quality',
		'detailed',
		'full body portrait',
		'white background',
	];

	return parts.filter(Boolean).join(', ');
}

function buildNegativePrompt(): string {
	return [
		'scary',
		'violent',
		'inappropriate',
		'adult content',
		'gore',
		'horror',
		'dark',
		'gloomy',
		'low quality',
		'blurry',
		'pixelated',
		'distorted',
		'disfigured',
		'bad anatomy',
		'extra limbs',
	].join(', ');
}

function buildStylePrompt(style: string): string {
	const styleGuides: Record<string, string> = {
		photorealistic: 'ultra-realistic, professional photography, natural lighting',
		anime: 'anime art style, cel-shaded, vibrant colors',
		cartoon: 'cartoon style, bold outlines, simple shapes, bright colors',
		watercolor: 'watercolor painting, soft edges, flowing colors',
		'whimsical illustration': "whimsical children's book illustration, friendly, warm colors",
	};

	return styleGuides[style] || styleGuides['whimsical illustration'];
}
