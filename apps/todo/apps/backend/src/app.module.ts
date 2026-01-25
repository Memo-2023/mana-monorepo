import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from './db/database.module';
import { HealthModule } from './health/health.module';
import { ProjectModule } from './project/project.module';
import { TaskModule } from './task/task.module';
import { LabelModule } from './label/label.module';
import { ReminderModule } from './reminder/reminder.module';
import { KanbanModule } from './kanban/kanban.module';
import { NetworkModule } from './network/network.module';
import { MetricsModule, MetricsInterceptor } from './metrics';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		ScheduleModule.forRoot(),
		MetricsModule,
		DatabaseModule,
		HealthModule,
		ProjectModule,
		TaskModule,
		LabelModule,
		ReminderModule,
		KanbanModule,
		NetworkModule,
	],
	providers: [
		{
			provide: APP_INTERCEPTOR,
			useClass: MetricsInterceptor,
		},
	],
})
export class AppModule {}
