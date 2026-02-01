import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HealthController, createHealthProvider } from '@manacore/matrix-bot-common';
import configuration from './config/configuration';
import { BotModule } from './bot/bot.module';
import { HandlersModule } from './handlers/handlers.module';
import { OrchestrationModule } from './orchestration/orchestration.module';

// Import shared services from bot-services package
import { TodoModule, CalendarModule, AiModule, ClockModule } from '@manacore/bot-services';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
		}),

		// Business Logic Modules from shared package
		TodoModule.registerAsync({
			imports: [ConfigModule],
			useFactory: (config: ConfigService) => ({
				storagePath: config.get('services.todo.storagePath'),
			}),
			inject: [ConfigService],
		}),

		CalendarModule.registerAsync({
			imports: [ConfigModule],
			useFactory: (config: ConfigService) => ({
				storagePath: config.get('services.calendar.storagePath'),
			}),
			inject: [ConfigService],
		}),

		AiModule.registerAsync({
			imports: [ConfigModule],
			useFactory: (config: ConfigService) => ({
				baseUrl: config.get('services.ai.baseUrl'),
				defaultModel: config.get('services.ai.defaultModel'),
				timeout: config.get('services.ai.timeout'),
			}),
			inject: [ConfigService],
		}),

		ClockModule.registerAsync({
			imports: [ConfigModule],
			useFactory: (config: ConfigService) => ({
				apiUrl: config.get('services.clock.apiUrl'),
			}),
			inject: [ConfigService],
		}),

		// Gateway-specific modules
		BotModule,
		HandlersModule,
		OrchestrationModule,
	],
	controllers: [HealthController],
	providers: [createHealthProvider('matrix-mana-bot')],
})
export class AppModule {}
