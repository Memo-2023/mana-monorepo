import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
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
})
export class AppModule {}
