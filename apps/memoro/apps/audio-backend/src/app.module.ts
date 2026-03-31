import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AudioController } from './audio.controller';
import { AudioService } from './audio.service';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		MulterModule.register({
			dest: './uploads',
			limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
		}),
		ThrottlerModule.forRoot([
			{
				name: 'short',
				ttl: 1000, // 1 second
				limit: 3, // 3 requests per second
			},
			{
				name: 'medium',
				ttl: 60000, // 1 minute
				limit: 20, // 20 requests per minute
			},
			{
				name: 'long',
				ttl: 3600000, // 1 hour
				limit: 100, // 100 requests per hour
			},
		]),
	],
	controllers: [AudioController],
	providers: [
		AudioService,
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
	],
})
export class AppModule {}
