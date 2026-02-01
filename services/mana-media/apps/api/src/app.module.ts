import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { UploadModule } from './modules/upload/upload.module';
import { StorageModule } from './modules/storage/storage.module';
import { ProcessModule } from './modules/process/process.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { HealthController } from './health.controller';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		BullModule.forRoot({
			connection: {
				host: process.env.REDIS_HOST || 'localhost',
				port: parseInt(process.env.REDIS_PORT || '6379'),
			},
		}),
		StorageModule,
		UploadModule,
		ProcessModule,
		DeliveryModule,
	],
	controllers: [HealthController],
})
export class AppModule {}
