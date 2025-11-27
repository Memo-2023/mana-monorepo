import { Injectable, OnModuleInit } from '@nestjs/common';
import { PipelineExecutor } from '../core/pipeline.executor';
import { PipelineRegistry } from '../core/pipeline.registry';
import { CharacterPipelineSteps } from './steps';
import { CharacterCreationInput, CharacterFinalOutput } from './types/character-pipeline.types';
import { validateCharacterStep } from './steps/validate-character.step';
import { generatePromptStep } from './steps/generate-prompt.step';
import { generateImageStep } from './steps/generate-image.step';
import { saveToDatabase } from './steps/save-database.step';
import { deductCreditsStep } from './steps/deduct-credits.step';
import { finalizeCharacterStep } from './steps/finalize-character.step';

@Injectable()
export class CharacterPipelineService implements OnModuleInit {
	constructor(
		private readonly pipelineExecutor: PipelineExecutor,
		private readonly pipelineRegistry: PipelineRegistry,
		private readonly characterSteps: CharacterPipelineSteps
	) {}

	onModuleInit() {
		// Register all character steps
		const steps = [
			validateCharacterStep,
			generatePromptStep,
			generateImageStep,
			saveToDatabase,
			deductCreditsStep,
			finalizeCharacterStep,
		];

		steps.forEach((step) => {
			this.pipelineRegistry.registerStep(step);
		});

		// Register the complete pipeline
		this.pipelineRegistry.registerPipeline('character-creation', steps);
	}

	async createCharacter(input: CharacterCreationInput): Promise<CharacterFinalOutput> {
		const steps = [
			validateCharacterStep,
			generatePromptStep,
			generateImageStep,
			saveToDatabase,
			deductCreditsStep,
			finalizeCharacterStep,
		];

		const result = await this.pipelineExecutor.execute<CharacterFinalOutput>(
			steps,
			input,
			input.userId
		);

		if (!result.success) {
			throw result.error || new Error('Character creation failed');
		}

		return result.data!;
	}

	async createCharacterWithoutImage(input: CharacterCreationInput): Promise<CharacterFinalOutput> {
		// Pipeline without image generation (faster, no credits)
		const steps = [
			validateCharacterStep,
			generatePromptStep,
			saveToDatabase,
			finalizeCharacterStep,
		];

		const result = await this.pipelineExecutor.execute<CharacterFinalOutput>(
			steps,
			input,
			input.userId
		);

		if (!result.success) {
			throw result.error || new Error('Character creation failed');
		}

		return result.data!;
	}

	async testSingleStep(stepName: string, input: any): Promise<any> {
		const step = this.characterSteps.getStep(stepName);

		if (!step) {
			throw new Error(`Step ${stepName} not found`);
		}

		const result = await this.pipelineExecutor.execute([step], input, input.userId);

		return result;
	}
}
