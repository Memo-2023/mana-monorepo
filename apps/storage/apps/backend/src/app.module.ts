import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { DatabaseModule } from './db/database.module';
import { HealthModule } from '@manacore/shared-nestjs-health';
import { MetricsModule } from '@manacore/shared-nestjs-metrics';
import { FileModule } from './file/file.module';
import { FolderModule } from './folder/folder.module';
import { ShareModule } from './share/share.module';
import { TagModule } from './tag/tag.module';
import { TrashModule } from './trash/trash.module';
import { SearchModule } from './search/search.module';
import { StorageModule } from './storage/storage.module';
import { AdminModule } from './admin/admin.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		LoggerModule.forRoot({
			pinoHttp: {
				transport:
					process.env.NODE_ENV !== 'production'
						? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
						: undefined,
				level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
				autoLogging: { ignore: (req) => ['/health', '/metrics'].includes((req as any).url) },
			},
		}),
		ThrottlerModule.forRoot([
			{
				ttl: 60000, // 60 seconds
				limit: 100, // 100 requests per minute
			},
		]),
		DatabaseModule,
		HealthModule.forRoot({ serviceName: 'storage-backend', route: 'api/v1/health' }),
		MetricsModule.register({
			prefix: 'storage_',
			excludePaths: ['/health'],
		}),
		StorageModule,
		FileModule,
		FolderModule,
		ShareModule,
		TagModule,
		TrashModule,
		SearchModule,
		AdminModule,
	],
})
export class AppModule {}
