import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController, createHealthProvider } from '@manacore/matrix-bot-common';
import { BotModule } from './bot/bot.module';
import { ManadeckModule } from './manadeck/manadeck.module';
import configuration from './config/configuration';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
		}),
		BotModule,
		ManadeckModule,
	],
	controllers: [HealthController],
	providers: [createHealthProvider('matrix-manadeck-bot')],
})
export class AppModule {}
