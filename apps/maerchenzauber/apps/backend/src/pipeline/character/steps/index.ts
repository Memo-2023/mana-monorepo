import { Injectable } from '@nestjs/common';
import { PipelineStep } from '../../core/pipeline.types';
import { validateCharacterStep } from './validate-character.step';
import { generatePromptStep } from './generate-prompt.step';
import { generateImageStep } from './generate-image.step';
import { saveToDatabase } from './save-database.step';
import { deductCreditsStep } from './deduct-credits.step';
import { finalizeCharacterStep } from './finalize-character.step';

@Injectable()
export class CharacterPipelineSteps {
  constructor() {} // Inject services here as needed

  getAllSteps(): PipelineStep[] {
    return [
      validateCharacterStep,
      generatePromptStep,
      generateImageStep,
      saveToDatabase,
      deductCreditsStep,
      finalizeCharacterStep,
    ];
  }

  getStep(name: string): PipelineStep | undefined {
    return this.getAllSteps().find((step) => step.name === name);
  }
}
