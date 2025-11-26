import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ArticlesModule } from './articles/articles.module';
import { CategoriesModule } from './categories/categories.module';
import { UsersModule } from './users/users.module';
import { ContentExtractionModule } from './content-extraction/content-extraction.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    DatabaseModule,
    AuthModule,
    ArticlesModule,
    CategoriesModule,
    UsersModule,
    ContentExtractionModule,
  ],
})
export class AppModule {}
