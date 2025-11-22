import { Module } from '@nestjs/common';
import { CharacterPipelineService } from './character-pipeline.service';
import { CharacterPipelineSteps } from './steps';
import { CoreModule } from '../../core/core.module';
import { CharacterModule } from '../../character/character.module';

@Module({
  imports: [CoreModule, CharacterModule],
  providers: [CharacterPipelineService, CharacterPipelineSteps],
  exports: [CharacterPipelineService, CharacterPipelineSteps],
})
export class CharacterPipelineModule {}
