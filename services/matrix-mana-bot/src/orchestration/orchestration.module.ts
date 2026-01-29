import { Module, forwardRef } from '@nestjs/common';
import { OrchestrationService } from './orchestration.service';
import { BotModule } from '../bot/bot.module';

@Module({
	imports: [forwardRef(() => BotModule)],
	providers: [OrchestrationService],
	exports: [OrchestrationService],
})
export class OrchestrationModule {}
