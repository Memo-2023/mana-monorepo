import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BotModule } from './bot/bot.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { HealthController, createHealthProvider } from '@manacore/matrix-bot-common';
import configuration from './config/configuration';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
		}),
		BotModule,
		SchedulerModule,
	],
	controllers: [HealthController],
	providers: [createHealthProvider('matrix-stats-bot')],
})
export class AppModule {}
