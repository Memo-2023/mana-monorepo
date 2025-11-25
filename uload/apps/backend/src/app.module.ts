import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClsModule } from 'nestjs-cls';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { ManaCoreModule } from '@mana-core/nestjs-integration';

import { validationSchema } from './config/validation.schema';
import { DatabaseModule } from './database/database.module';
import { LinkRepository } from './database/repositories/link.repository';
import { ClickRepository } from './database/repositories/click.repository';

import { HealthController } from './controllers/health.controller';
import { RedirectController } from './controllers/redirect.controller';
import { LinksController } from './controllers/links.controller';
import { AnalyticsController } from './controllers/analytics.controller';

import { LinksService } from './services/links.service';
import { RedirectService } from './services/redirect.service';
import { AnalyticsService } from './services/analytics.service';

@Module({
  imports: [
    // Context-Local Storage for request-scoped data
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true, generateId: true },
    }),

    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),

    // Mana Core Authentication
    ManaCoreModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        manaServiceUrl: configService.get<string>('MANA_SERVICE_URL')!,
        appId: configService.get<string>('APP_ID')!,
        serviceKey: configService.get<string>('MANA_SERVICE_KEY', ''),
        debug: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }) as any,

    // Health checks
    TerminusModule,
    HttpModule,

    // Database
    DatabaseModule,
  ],
  controllers: [
    HealthController,
    RedirectController,
    LinksController,
    AnalyticsController,
  ],
  providers: [
    // Repositories
    LinkRepository,
    ClickRepository,
    // Services
    LinksService,
    RedirectService,
    AnalyticsService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Add custom middleware here if needed
  }
}
