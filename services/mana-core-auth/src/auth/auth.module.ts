import { Module, forwardRef } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { BetterAuthService } from './services/better-auth.service';
import { ReferralsModule } from '../referrals/referrals.module';
import { SecurityModule } from '../security/security.module';

@Module({
	imports: [forwardRef(() => ReferralsModule), SecurityModule],
	controllers: [AuthController],
	providers: [BetterAuthService],
	exports: [BetterAuthService],
})
export class AuthModule {}
