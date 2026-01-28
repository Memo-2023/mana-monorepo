import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { BotModule } from './bot/bot.module';
import { TodoModule } from './todo/todo.module';
import { HealthController } from './health.controller';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
		}),
		BotModule,
		TodoModule,
	],
	controllers: [HealthController],
})
export class AppModule {}
