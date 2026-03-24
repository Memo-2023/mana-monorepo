import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LlmModule } from '@manacore/shared-llm';
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
		LlmModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (config: ConfigService) => ({
				manaLlmUrl: config.get('MANA_LLM_URL') || 'http://localhost:3025',
				debug: config.get('NODE_ENV') === 'development',
			}),
			inject: [ConfigService],
		}),
		DatabaseModule,
		BotModule,
	],
	controllers: [HealthController],
	providers: [createHealthProvider('matrix-project-doc-bot')],
})
export class AppModule {}
