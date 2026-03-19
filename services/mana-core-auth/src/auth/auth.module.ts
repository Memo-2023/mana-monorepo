import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { BetterAuthPassthroughController } from './better-auth-passthrough.controller';
import { OidcController } from './oidc.controller';
import { OidcLoginController } from './oidc-login.controller';
import { MatrixSessionController } from './matrix-session.controller';
import { BetterAuthService } from './services/better-auth.service';
import { MatrixSessionService } from './services/matrix-session.service';
import { SecurityModule } from '../security';

@Module({
	imports: [SecurityModule],
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
