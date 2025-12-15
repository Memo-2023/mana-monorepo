import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './db/database.module';
import { HealthModule } from './health/health.module';
import { CalendarModule } from './calendar/calendar.module';
import { EventModule } from './event/event.module';
import { EventTagModule } from './event-tag/event-tag.module';
import { EventTagGroupModule } from './event-tag-group/event-tag-group.module';
import { ReminderModule } from './reminder/reminder.module';
import { ShareModule } from './share/share.module';
import { NetworkModule } from './network/network.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		ScheduleModule.forRoot(),
		DatabaseModule,
		HealthModule,
		CalendarModule,
		EventModule,
		EventTagModule,
		EventTagGroupModule,
		ReminderModule,
		ShareModule,
		NetworkModule,
	],
})
export class AppModule {}
