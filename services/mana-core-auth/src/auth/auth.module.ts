import { Module, forwardRef } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { BetterAuthService } from './services/better-auth.service';
import { ReferralsModule } from '../referrals/referrals.module';

@Module({
	imports: [forwardRef(() => ReferralsModule)],
	controllers: [AuthController],
	providers: [BetterAuthService],
	exports: [BetterAuthService],
})
export class AuthModule {}
