import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';

/**
 * Email Module
 *
 * Provides transactional email functionality using Brevo.
 * This module is marked as Global so the EmailService can be
 * injected anywhere without importing the module.
 */
@Global()
@Module({
	providers: [EmailService],
	exports: [EmailService],
})
export class EmailModule {}
