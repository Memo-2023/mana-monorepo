import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { SpacesClientService } from './spaces-client.service';

@Module({
	imports: [HttpModule, ConfigModule],
	providers: [SpacesClientService],
	exports: [SpacesClientService],
})
export class SpacesModule {}
