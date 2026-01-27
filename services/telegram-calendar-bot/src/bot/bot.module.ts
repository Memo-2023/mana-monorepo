import { Module } from '@nestjs/common';
import { BotUpdate } from './bot.update';
import { CalendarModule } from '../calendar/calendar.module';
import { UserModule } from '../user/user.module';

@Module({
	imports: [CalendarModule, UserModule],
	providers: [BotUpdate],
})
export class BotModule {}
