import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './db/database.module';
import { FavoriteModule } from './favorite/favorite.module';
import { ListModule } from './list/list.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    FavoriteModule,
    ListModule,
    HealthModule,
  ],
})
export class AppModule {}
