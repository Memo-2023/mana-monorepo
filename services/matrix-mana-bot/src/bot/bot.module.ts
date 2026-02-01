import { Module, forwardRef } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { CommandRouterService } from './command-router.service';
import { HandlersModule } from '../handlers/handlers.module';
import { OrchestrationModule } from '../orchestration/orchestration.module';
import { VoiceModule } from '../voice/voice.module';

@Module({
	imports: [forwardRef(() => HandlersModule), forwardRef(() => OrchestrationModule), VoiceModule],
	providers: [MatrixService, CommandRouterService],
	exports: [MatrixService, CommandRouterService],
})
export class BotModule {}
