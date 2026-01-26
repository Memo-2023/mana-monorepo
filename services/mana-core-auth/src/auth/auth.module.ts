import { Module, forwardRef } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { BetterAuthPassthroughController } from './better-auth-passthrough.controller';
import { BetterAuthService } from './services/better-auth.service';
import { ReferralsModule } from '../referrals/referrals.module';

@Module({
	imports: [forwardRef(() => ReferralsModule)],
	controllers: [AuthController, BetterAuthPassthroughController],
	providers: [BetterAuthService],
	exports: [BetterAuthService],
})
export class AuthModule {}
