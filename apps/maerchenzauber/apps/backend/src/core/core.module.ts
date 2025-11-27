import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import { ImageSupabaseService } from './services/image-supabase.service';
import { ImageOptimizationService } from './services/image-optimization.service';
import { ImageController } from './controllers/image.controller';
// import { CustomFirestoreService } from './services/firestore.service';
import { SettingsService } from './services/settings.service';
import { PromptingService } from './services/prompting.service';
import { CoreService } from './services/core.service';
import { SupabaseService } from './services/supabase.service';
import { SupabaseDataService } from './services/supabase-data.service';
import { SupabaseJsonbAuthService } from './services/supabase-jsonb-auth.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { AuthenticatedSupabaseService } from './services/authenticated-supabase.service';
import { SupabaseClientService } from './services/supabase-client.service';
import { RequestContextInterceptor } from './interceptors/request-context.interceptor';
import { RequestContextService } from '../common/services/request-context.service';
import { StoryLogbookService } from './services/story-logbook.service';
import { ErrorLoggingService } from './services/error-logging.service';

@Module({
	imports: [
		SupabaseModule,
		ConfigModule,
		// Configure ClsModule for request context management
		ClsModule.forRoot({
			global: true,
			middleware: {
				// Don't mount middleware automatically - we'll use interceptor instead
				mount: false,
			},
		}),
	],
	controllers: [ImageController],
	providers: [
		ImageSupabaseService,
		ImageOptimizationService,
		SettingsService,
		// CustomFirestoreService,
		PromptingService,
		CoreService,
		SupabaseService,
		SupabaseDataService,
		SupabaseJsonbAuthService,
		AuthenticatedSupabaseService,
		SupabaseClientService,
		RequestContextInterceptor,
		RequestContextService,
		StoryLogbookService,
		ErrorLoggingService,
	],
	exports: [
		ImageSupabaseService,
		ImageOptimizationService,
		SettingsService,
		// CustomFirestoreService,
		PromptingService,
		CoreService,
		SupabaseService,
		SupabaseDataService,
		SupabaseJsonbAuthService,
		AuthenticatedSupabaseService,
		SupabaseClientService,
		RequestContextInterceptor,
		RequestContextService,
		StoryLogbookService,
		ErrorLoggingService,
	],
})
export class CoreModule {}
