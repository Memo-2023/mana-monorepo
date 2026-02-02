import { Module, forwardRef } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { BetterAuthPassthroughController } from './better-auth-passthrough.controller';
import { OidcController } from './oidc.controller';
import { OidcLoginController } from './oidc-login.controller';
import { MatrixSessionController } from './matrix-session.controller';
import { BetterAuthService } from './services/better-auth.service';
import { MatrixSessionService } from './services/matrix-session.service';
import { ReferralsModule } from '../referrals/referrals.module';

@Module({
	imports: [forwardRef(() => ReferralsModule)],
	controllers: [
		AuthController,
		BetterAuthPassthroughController,
		OidcController,
		OidcLoginController,
		MatrixSessionController,
	],
	providers: [BetterAuthService, MatrixSessionService],
	exports: [BetterAuthService, MatrixSessionService],
})
export class AuthModule {}
