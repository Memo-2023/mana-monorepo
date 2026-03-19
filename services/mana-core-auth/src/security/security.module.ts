import { Module } from '@nestjs/common';
import { SecurityEventsService } from './security-events.service';
import { AccountLockoutService } from './account-lockout.service';
import { LoggerModule } from '../common/logger';

@Module({
	imports: [LoggerModule],
	providers: [SecurityEventsService, AccountLockoutService],
	exports: [SecurityEventsService, AccountLockoutService],
})
export class SecurityModule {}
