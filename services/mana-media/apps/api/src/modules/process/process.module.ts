import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ProcessService } from './process.service';
import { ProcessWorker } from './process.worker';
import { PROCESS_QUEUE } from './process.constants';
import { UploadModule } from '../upload/upload.module';

@Module({
	imports: [
		BullModule.registerQueue({
			name: PROCESS_QUEUE,
		}),
		forwardRef(() => UploadModule),
	],
	providers: [ProcessService, ProcessWorker],
	exports: [ProcessService],
})
export class ProcessModule {}
