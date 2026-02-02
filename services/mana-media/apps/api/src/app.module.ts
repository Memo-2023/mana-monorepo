import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { DatabaseModule } from './db/database.module';
import { UploadModule } from './modules/upload/upload.module';
import { StorageModule } from './modules/storage/storage.module';
import { ProcessModule } from './modules/process/process.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { MatrixModule } from './modules/matrix/matrix.module';
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
				password: process.env.REDIS_PASSWORD || undefined,
			},
		}),
		DatabaseModule,
		StorageModule,
		UploadModule,
		ProcessModule,
		DeliveryModule,
		MatrixModule,
	],
	controllers: [HealthController],
})
export class AppModule {}
