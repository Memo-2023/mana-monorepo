import { Module } from '@nestjs/common';
import { DeliveryController } from './delivery.controller';
import { UploadModule } from '../upload/upload.module';
import { ProcessModule } from '../process/process.module';

@Module({
	imports: [UploadModule, ProcessModule],
	controllers: [DeliveryController],
})
export class DeliveryModule {}
