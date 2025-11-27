import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { ManaCoreModule } from '@mana-core/nestjs-integration';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiController } from './controllers/api.controller';
import { PublicController } from './controllers/public.controller';
import { HealthController } from './controllers/health.controller';
import { validationSchema } from './config/validation.schema';
import { AiService } from './services/ai.service';
import {
	DatabaseModule,
	DeckRepository,
	CardRepository,
	UserStatsRepository,
	DeckTemplateRepository,
	StudySessionRepository,
	CardProgressRepository,
} from './database';

@Module({
	imports: [
		// Context storage for request-scoped data (must be first)
		ClsModule.forRoot({
			global: true,
			middleware: {
				mount: true,
				generateId: true,
			},
		}),

		// Configuration management
		ConfigModule.forRoot({
			isGlobal: true,
			validationSchema,
			ignoreEnvFile: process.env.NODE_ENV === 'production',
		}),

		// Mana Core authentication
		ManaCoreModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				manaServiceUrl: configService.get<string>(
					'MANA_SERVICE_URL',
					'https://mana-core-middleware-111768794939.europe-west3.run.app'
				),
				appId: configService.get<string>('APP_ID', 'cea4bfc6-a4de-4e17-91e2-54275940156e'),
				serviceKey: configService.get<string>('MANA_SUPABASE_SECRET_KEY', ''), // Required for service-to-service communication
				signupRedirectUrl: configService.get<string>(
					'SIGNUP_REDIRECT_URL',
					'https://manadeck.com/welcome'
				),
				debug: configService.get('NODE_ENV') === 'development',
			}),
			inject: [ConfigService],
		}) as any,

		// Health checks
		TerminusModule,
		HttpModule,

		// Database (Drizzle/PostgreSQL)
		DatabaseModule,
	],
	controllers: [AppController, ApiController, PublicController, HealthController],
	providers: [
		AppService,
		// AI Service
		AiService,
		// Database repositories
		DeckRepository,
		CardRepository,
		UserStatsRepository,
		DeckTemplateRepository,
		StudySessionRepository,
		CardProgressRepository,
	],
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		// Add any custom middleware here
	}
}
