import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { CreditsModule } from '../credits/credits.module';
import { MemoroModule } from '../memoro/memoro.module';
import { MeetingsController } from './meetings.controller';
import { MeetingsWebhookController } from './meetings-webhook.controller';
import { MeetingsProxyService } from './meetings-proxy.service';

@Module({
	imports: [ConfigModule, AuthModule, CreditsModule, forwardRef(() => MemoroModule)],
	controllers: [MeetingsController, MeetingsWebhookController],
	providers: [MeetingsProxyService],
	exports: [MeetingsProxyService],
})
export class MeetingsModule {}
