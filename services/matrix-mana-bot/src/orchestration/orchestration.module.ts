import { Module, forwardRef } from '@nestjs/common';
import { OrchestrationService } from './orchestration.service';
import { BotModule } from '../bot/bot.module';
import { AiModule, TodoModule, CalendarModule } from '@manacore/bot-services';

@Module({
	imports: [
		forwardRef(() => BotModule),
		// Import service modules so their services are available
		AiModule,
		TodoModule,
		CalendarModule,
	],
	providers: [OrchestrationService],
	exports: [OrchestrationService],
})
export class OrchestrationModule {}
