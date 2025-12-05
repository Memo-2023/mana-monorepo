import { Module } from '@nestjs/common';
import { OAuthController } from './oauth.controller';
import { GoogleOAuthService } from './google-oauth.service';
import { MicrosoftOAuthService } from './microsoft-oauth.service';
import { AccountModule } from '../account/account.module';

@Module({
	imports: [AccountModule],
	controllers: [OAuthController],
	providers: [GoogleOAuthService, MicrosoftOAuthService],
	exports: [GoogleOAuthService, MicrosoftOAuthService],
})
export class OAuthModule {}
