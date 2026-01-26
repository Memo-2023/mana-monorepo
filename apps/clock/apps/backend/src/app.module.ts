import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './db/database.module';
import { HealthModule } from './health/health.module';
import { AlarmModule } from './alarm/alarm.module';
import { TimerModule } from './timer/timer.module';
import { WorldClockModule } from './world-clock/world-clock.module';
import { PresetModule } from './preset/preset.module';
import { MetricsModule } from './metrics';

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
		AlarmModule,
		TimerModule,
		WorldClockModule,
		PresetModule,
	],
})
export class AppModule {}
