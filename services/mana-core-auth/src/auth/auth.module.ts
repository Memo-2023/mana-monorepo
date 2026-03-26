import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { BetterAuthPassthroughController } from './better-auth-passthrough.controller';
import { OidcController } from './oidc.controller';
import { OidcLoginController } from './oidc-login.controller';
import { MatrixSessionController } from './matrix-session.controller';
import { BetterAuthService } from './services/better-auth.service';
import { MatrixSessionService } from './services/matrix-session.service';
import { PasskeyService } from './services/passkey.service';
import { SecurityModule } from '../security';

@Module({
	imports: [SecurityModule, ConfigModule],
	controllers: [
		AuthController,
		BetterAuthPassthroughController,
		OidcController,
		OidcLoginController,
		MatrixSessionController,
	],
	providers: [BetterAuthService, MatrixSessionService, PasskeyService],
	exports: [BetterAuthService, MatrixSessionService, PasskeyService],
})
export class AuthModule {}
