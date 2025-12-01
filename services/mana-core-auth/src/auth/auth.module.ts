import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { BetterAuthService } from './services/better-auth.service';

@Module({
	controllers: [AuthController],
	providers: [BetterAuthService],
	exports: [BetterAuthService],
})
export class AuthModule {}
