import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController, createHealthProvider } from '@manacore/matrix-bot-common';
import { BotModule } from './bot/bot.module';
import { SttModule } from './stt/stt.module';
import configuration from './config/configuration';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
		}),
		SttModule,
		BotModule,
	],
	controllers: [HealthController],
	providers: [createHealthProvider('matrix-stt-bot')],
})
export class AppModule {}
