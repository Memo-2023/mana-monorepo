import { Module } from '@nestjs/common';
import { ComposeController } from './compose.controller';
import { ComposeService } from './compose.service';
import { AccountModule } from '../account/account.module';
import { EmailModule } from '../email/email.module';

@Module({
	imports: [AccountModule, EmailModule],
	controllers: [ComposeController],
	providers: [ComposeService],
	exports: [ComposeService],
})
export class ComposeModule {}
