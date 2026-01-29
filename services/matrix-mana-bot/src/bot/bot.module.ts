import { Module, forwardRef } from '@nestjs/common';
import { MatrixService } from './matrix.service';
import { CommandRouterService } from './command-router.service';
import { HandlersModule } from '../handlers/handlers.module';
import { OrchestrationModule } from '../orchestration/orchestration.module';

@Module({
	imports: [forwardRef(() => HandlersModule), forwardRef(() => OrchestrationModule)],
	providers: [MatrixService, CommandRouterService],
	exports: [MatrixService, CommandRouterService],
})
export class BotModule {}
