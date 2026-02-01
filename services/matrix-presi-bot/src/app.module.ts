import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController, createHealthProvider } from '@manacore/matrix-bot-common';
import { BotModule } from './bot/bot.module';
import { PresiModule } from './presi/presi.module';
import configuration from './config/configuration';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
		}),
		BotModule,
		PresiModule,
	],
	controllers: [HealthController],
	providers: [createHealthProvider('matrix-presi-bot')],
})
export class AppModule {}
