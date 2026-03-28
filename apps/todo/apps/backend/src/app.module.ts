import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { MetricsModule } from '@manacore/shared-nestjs-metrics';
import { ManaCoreModule } from '@manacore/nestjs-integration';
import { DatabaseModule } from './db/database.module';
import { HealthModule } from '@manacore/shared-nestjs-health';
import { ProjectModule } from './project/project.module';
import { TaskModule } from './task/task.module';
import { LabelModule } from './label/label.module';
import { ReminderModule } from './reminder/reminder.module';
import { NetworkModule } from './network/network.module';
import { AdminModule } from './admin/admin.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		ScheduleModule.forRoot(),
		ThrottlerModule.forRoot([
			{
				ttl: 60000, // 60 seconds
				limit: 100, // 100 requests per minute
			},
		]),
		MetricsModule.register({
			prefix: 'todo_',
			excludePaths: ['/health'],
		}),
		ManaCoreModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				appId: configService.get<string>('APP_ID', 'todo'),
				serviceKey: configService.get<string>('MANA_CORE_SERVICE_KEY', ''),
				debug: configService.get('NODE_ENV') === 'development',
			}),
			inject: [ConfigService],
		}),
		DatabaseModule,
		HealthModule.forRoot({ serviceName: 'todo-backend' }),
		ProjectModule,
		TaskModule,
		LabelModule,
		ReminderModule,
		NetworkModule,
		AdminModule,
	],
})
export class AppModule {}
