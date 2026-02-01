import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController, createHealthProvider } from '@manacore/matrix-bot-common';
import { DatabaseModule } from './database/database.module';
import { BotModule } from './bot/bot.module';
import configuration from './config/configuration';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
		}),
		DatabaseModule,
		BotModule,
	],
	controllers: [HealthController],
	providers: [createHealthProvider('matrix-project-doc-bot')],
})
export class AppModule {}
