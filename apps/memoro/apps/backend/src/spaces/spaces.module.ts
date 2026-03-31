import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { SpacesClientService } from './spaces-client.service';
import { SpaceSyncService } from './space-sync.service';

@Module({
	imports: [HttpModule, ConfigModule],
	providers: [SpacesClientService, SpaceSyncService],
	exports: [SpacesClientService, SpaceSyncService],
})
export class SpacesModule {}
