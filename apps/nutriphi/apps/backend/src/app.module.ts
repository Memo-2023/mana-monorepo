import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { StorageModule } from './storage/storage.module';
import { HealthModule } from './health/health.module';
import { GeminiModule } from './gemini/gemini.module';
import { MealsModule } from './meals/meals.module';
import { SyncModule } from './sync/sync.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    StorageModule,
    HealthModule,
    GeminiModule,
    MealsModule,
    SyncModule,
  ],
})
export class AppModule {}
