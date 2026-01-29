import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';
import { DatabaseModule } from './db/database.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { QueueModule } from './queue/queue.module';
import { ChannelsModule } from './channels/channels.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TemplatesModule } from './templates/templates.module';
import { DevicesModule } from './devices/devices.module';
import { PreferencesModule } from './preferences/preferences.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
		}),
		BullModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				connection: {
					host: configService.get<string>('redis.host', 'localhost'),
					port: configService.get<number>('redis.port', 6379),
				},
			}),
			inject: [ConfigService],
		}),
		ScheduleModule.forRoot(),
		DatabaseModule,
		HealthModule,
		MetricsModule,
		QueueModule,
		ChannelsModule,
		NotificationsModule,
		TemplatesModule,
		DevicesModule,
		PreferencesModule,
	],
})
export class AppModule {}
