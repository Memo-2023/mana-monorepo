import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController, createHealthProvider } from '@manacore/matrix-bot-common';
import { BotModule } from './bot/bot.module';
import { TtsModule } from './tts/tts.module';
import configuration from './config/configuration';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
		}),
		TtsModule,
		BotModule,
	],
	controllers: [HealthController],
	providers: [createHealthProvider('matrix-tts-bot')],
})
export class AppModule {}
