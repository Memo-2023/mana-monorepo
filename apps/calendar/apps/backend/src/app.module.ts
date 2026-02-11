import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MetricsModule } from '@manacore/shared-nestjs-metrics';
import { ManaCoreModule } from '@manacore/nestjs-integration';
import { DatabaseModule } from './db/database.module';
import { HealthModule } from '@manacore/shared-nestjs-health';
import { CalendarModule } from './calendar/calendar.module';
import { EventModule } from './event/event.module';
import { EventTagModule } from './event-tag/event-tag.module';
import { EventTagGroupModule } from './event-tag-group/event-tag-group.module';
import { ReminderModule } from './reminder/reminder.module';
import { ShareModule } from './share/share.module';
import { SyncModule } from './sync/sync.module';
import { NetworkModule } from './network/network.module';
import { EmailModule } from './email/email.module';
import { NotificationModule } from './notification/notification.module';
import { AdminModule } from './admin/admin.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		ScheduleModule.forRoot(),
		MetricsModule.register({
			prefix: 'calendar_',
			excludePaths: ['/health'],
		}),
		ManaCoreModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				appId: configService.get<string>('APP_ID', 'calendar'),
				serviceKey: configService.get<string>('MANA_CORE_SERVICE_KEY', ''),
				debug: configService.get('NODE_ENV') === 'development',
			}),
			inject: [ConfigService],
		}),
		DatabaseModule,
		HealthModule.forRoot({ serviceName: 'calendar-backend' }),
		EmailModule,
		NotificationModule,
		CalendarModule,
		EventModule,
		EventTagModule,
		EventTagGroupModule,
		ReminderModule,
		ShareModule,
		SyncModule,
		NetworkModule,
		AdminModule,
	],
})
export class AppModule {}
