import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { PROCESS_QUEUE } from '../process/process.constants';

@Module({
	imports: [
		BullModule.registerQueue({
			name: PROCESS_QUEUE,
		}),
	],
	controllers: [UploadController],
	providers: [UploadService],
	exports: [UploadService],
})
export class UploadModule {}
