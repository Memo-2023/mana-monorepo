import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { BotModule } from './bot/bot.module';
import { PresiModule } from './presi/presi.module';
import { SessionModule } from './session/session.module';
import configuration from './config/configuration';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
		}),
		BotModule,
		PresiModule,
		SessionModule,
	],
	controllers: [HealthController],
})
export class AppModule {}
