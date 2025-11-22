import { Module } from '@nestjs/common';
import { ImageController } from './controllers/image.controller';
import { ImageSupabaseService } from './services/image-supabase.service';

@Module({
  controllers: [ImageController],
  providers: [ImageSupabaseService],
  exports: [ImageSupabaseService],
})
export class ImageModule {}
