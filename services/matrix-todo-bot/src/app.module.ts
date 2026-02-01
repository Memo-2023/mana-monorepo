import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController, createHealthProvider } from '@manacore/matrix-bot-common';
import configuration from './config/configuration';
import { BotModule } from './bot/bot.module';
import { TodoModule } from './todo/todo.module';

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
	providers: [createHealthProvider('matrix-todo-bot')],
})
export class AppModule {}
