import { Module, Global } from '@nestjs/common';
import { PipelineExecutor } from './core/pipeline.executor';
import { PipelineRegistry } from './core/pipeline.registry';
import { PipelineTestingController } from './pipeline-testing.controller';
import { CharacterPipelineModule } from './character/character-pipeline.module';

@Global()
@Module({
  imports: [CharacterPipelineModule],
  controllers: [PipelineTestingController],
  providers: [PipelineExecutor, PipelineRegistry],
  exports: [PipelineExecutor, PipelineRegistry],
})
export class PipelineModule {}
