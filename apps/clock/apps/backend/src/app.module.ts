import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MetricsModule } from '@manacore/shared-nestjs-metrics';
import { DatabaseModule } from './db/database.module';
import { HealthModule } from '@manacore/shared-nestjs-health';
import { AlarmModule } from './alarm/alarm.module';
import { TimerModule } from './timer/timer.module';
import { WorldClockModule } from './world-clock/world-clock.module';
import { PresetModule } from './preset/preset.module';
import { AdminModule } from './admin/admin.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		ScheduleModule.forRoot(),
		MetricsModule.register({
			prefix: 'clock_',
			excludePaths: ['/health'],
		}),
		DatabaseModule,
		HealthModule.forRoot({ serviceName: 'clock-backend' }),
		AlarmModule,
		TimerModule,
		WorldClockModule,
		PresetModule,
		AdminModule,
	],
})
export class AppModule {}
