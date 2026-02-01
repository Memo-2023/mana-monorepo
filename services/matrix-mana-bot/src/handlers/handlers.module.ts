import { Module, forwardRef } from '@nestjs/common';
import { AiHandler } from './ai.handler';
import { TodoHandler } from './todo.handler';
import { CalendarHandler } from './calendar.handler';
import { ClockHandler } from './clock.handler';
import { HelpHandler } from './help.handler';
import { VoiceHandler } from './voice.handler';
import { BotModule } from '../bot/bot.module';
import { VoiceModule } from '../voice/voice.module';

@Module({
	imports: [forwardRef(() => BotModule), VoiceModule],
	providers: [AiHandler, TodoHandler, CalendarHandler, ClockHandler, HelpHandler, VoiceHandler],
	exports: [AiHandler, TodoHandler, CalendarHandler, ClockHandler, HelpHandler, VoiceHandler],
})
export class HandlersModule {}
