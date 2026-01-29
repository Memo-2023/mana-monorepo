import { Module } from '@nestjs/common';
import { EmailService } from './email/email.service';
import { PushService } from './push/push.service';
import { MatrixService } from './matrix/matrix.service';
import { WebhookService } from './webhook/webhook.service';

@Module({
	providers: [EmailService, PushService, MatrixService, WebhookService],
	exports: [EmailService, PushService, MatrixService, WebhookService],
})
export class ChannelsModule {}
