import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController, createHealthProvider } from '@manacore/matrix-bot-common';
import configuration from './config/configuration';
import { BotModule } from './bot/bot.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
		}),
		BotModule,
	],
	controllers: [HealthController],
	providers: [createHealthProvider('matrix-calendar-bot')],
})
export class AppModule {}
