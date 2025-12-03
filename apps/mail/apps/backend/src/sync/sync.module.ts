import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { ImapProvider } from './providers/imap.provider';
import { GmailProvider } from './providers/gmail.provider';
import { OutlookProvider } from './providers/outlook.provider';
import { AccountModule } from '../account/account.module';
import { AttachmentModule } from '../attachment/attachment.module';

@Module({
	imports: [AccountModule, AttachmentModule],
	controllers: [SyncController],
	providers: [SyncService, ImapProvider, GmailProvider, OutlookProvider],
	exports: [SyncService],
})
export class SyncModule {}
