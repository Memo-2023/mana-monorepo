import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LlmModule } from '@manacore/shared-llm';
import { HealthController, createHealthProvider } from '@manacore/matrix-bot-common';
import { BotModule } from './bot/bot.module';
import configuration from './config/configuration';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
		}),
		LlmModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (config: ConfigService) => ({
				manaLlmUrl: config.get('llm.url') || 'http://localhost:3025',
				defaultModel: config.get('llm.model') || 'ollama/gemma3:4b',
				timeout: config.get<number>('llm.timeout') || 120000,
			}),
			inject: [ConfigService],
		}),
		BotModule,
	],
	controllers: [HealthController],
	providers: [createHealthProvider('matrix-ollama-bot')],
})
export class AppModule {}
