import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SecurityEventsService } from './security-events.service';

/**
 * Security Module
 *
 * Provides security-related services for the application:
 * - Security event logging and audit trails
 * - Compliance support (GDPR, SOC 2, ISO 27001)
 *
 * Import this module in AppModule to enable security logging across the app.
 */
@Module({
	imports: [ConfigModule],
	providers: [SecurityEventsService],
	exports: [SecurityEventsService],
})
export class SecurityModule {}
