import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ClsModule } from 'nestjs-cls';
import { ManaCoreModule } from '@mana-core/nestjs-integration';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './config/app.config';
import { validationSchema } from './config/validation.schema';
import { CharacterModule } from './character/character.module';
import { StoryModule } from './story/story.module';
import { CoreModule } from './core/core.module';
import { SupabaseModule } from './supabase/supabase.module';
import { SettingsModule } from './settings/settings.module';
import { HealthModule } from './health/health.module';
import { CommonModule } from './common/common.module';
import { RequestContextInterceptor } from './common/interceptors/request-context.interceptor';
import { CreatorsModule } from './creators/creators.module';
import { FeedbackModule } from './feedback/feedback.module';

@Module({
	imports: [
		// CLS Module must be first to initialize the context storage
		ClsModule.forRoot({
			global: true,
			middleware: {
				mount: true,
				generateId: true,
			},
		}),
		ConfigModule.forRoot({
			isGlobal: true,
			load: [appConfig],
			validationSchema,
		}),
		CommonModule, // Add CommonModule early since it's global
		// Mana Core Module for authentication
		ManaCoreModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				manaServiceUrl: 'https://mana-core-middleware-111768794939.europe-west3.run.app',
				appId: '8d2f5ddb-e251-4b3b-8802-84022a7ac77f',
				serviceKey: configService.get<string>('MANA_SUPABASE_SECRET_KEY', ''),
				signupRedirectUrl: configService.get<string>('SIGNUP_REDIRECT_URL', ''),
				debug: configService.get('NODE_ENV') === 'development',
			}),
			inject: [ConfigService],
		}),
		CoreModule,
		SupabaseModule,
		CharacterModule,
		StoryModule,
		SettingsModule,
		HealthModule,
		CreatorsModule,
		FeedbackModule,
	],
	controllers: [AppController],
	providers: [
		AppService,
		// Register RequestContextInterceptor as a global interceptor
		{
			provide: APP_INTERCEPTOR,
			useClass: RequestContextInterceptor,
		},
	],
})
export class AppModule implements NestModule {
	configure(_consumer: MiddlewareConsumer) {
		// Middleware configuration can be added here if needed
	}
}
