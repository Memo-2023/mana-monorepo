import { Module } from '@nestjs/common';
import { GenerateController } from './generate.controller';
import { GenerateService } from './generate.service';
import { ReplicateService } from './replicate.service';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [GenerateController],
  providers: [GenerateService, ReplicateService],
  exports: [GenerateService],
})
export class GenerateModule {}
