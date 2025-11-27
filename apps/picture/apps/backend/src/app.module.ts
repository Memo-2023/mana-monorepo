import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './db/database.module';
import { HealthModule } from './health/health.module';
import { ModelModule } from './model/model.module';
import { TagModule } from './tag/tag.module';
import { ImageModule } from './image/image.module';
import { BoardModule } from './board/board.module';
import { BoardItemModule } from './board-item/board-item.module';
import { UploadModule } from './upload/upload.module';
import { GenerateModule } from './generate/generate.module';
import { ExploreModule } from './explore/explore.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    HealthModule,
    ModelModule,
    TagModule,
    ImageModule,
    BoardModule,
    BoardItemModule,
    UploadModule,
    GenerateModule,
    ExploreModule,
  ],
})
export class AppModule {}
