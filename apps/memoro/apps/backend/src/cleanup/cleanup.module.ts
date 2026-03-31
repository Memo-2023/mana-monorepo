import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AudioCleanupService } from './audio-cleanup.service';
import { AudioCleanupController } from './audio-cleanup.controller';

@Module({
	imports: [ConfigModule],
	controllers: [AudioCleanupController],
	providers: [AudioCleanupService],
	exports: [AudioCleanupService],
})
export class CleanupModule {}
