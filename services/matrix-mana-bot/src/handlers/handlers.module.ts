import { Module, forwardRef } from '@nestjs/common';
import { AiHandler } from './ai.handler';
import { TodoHandler } from './todo.handler';
import { CalendarHandler } from './calendar.handler';
import { ClockHandler } from './clock.handler';
import { HelpHandler } from './help.handler';
import { BotModule } from '../bot/bot.module';

@Module({
	imports: [forwardRef(() => BotModule)],
	providers: [AiHandler, TodoHandler, CalendarHandler, ClockHandler, HelpHandler],
	exports: [AiHandler, TodoHandler, CalendarHandler, ClockHandler, HelpHandler],
})
export class HandlersModule {}
