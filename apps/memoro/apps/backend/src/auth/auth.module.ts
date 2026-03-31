import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AuthClientService } from './auth-client.service';

@Module({
	imports: [HttpModule, ConfigModule],
	providers: [AuthClientService],
	exports: [AuthClientService],
})
export class AuthModule {}
