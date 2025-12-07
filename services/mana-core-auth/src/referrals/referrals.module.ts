/**
 * Referrals Module
 *
 * NestJS module for the referral system.
 * Provides services for:
 * - Referral code management
 * - Referral tracking and stage progression
 * - Tier calculation and bonus multipliers
 * - Fraud detection and prevention
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ReferralsController } from './referrals.controller';
import { ReferralsAdminController } from './referrals-admin.controller';
import { ReferralCodeService } from './services/referral-code.service';
import { ReferralTierService } from './services/referral-tier.service';
import { ReferralTrackingService } from './services/referral-tracking.service';
import { FraudDetectionService } from './services/fraud-detection.service';
import { ReferralCronService } from './services/referral-cron.service';

@Module({
	imports: [ConfigModule, ScheduleModule.forRoot()],
	controllers: [ReferralsController, ReferralsAdminController],
	providers: [
		ReferralCodeService,
		ReferralTierService,
		ReferralTrackingService,
		FraudDetectionService,
		ReferralCronService,
	],
	exports: [
		ReferralCodeService,
		ReferralTierService,
		ReferralTrackingService,
		FraudDetectionService,
	],
})
export class ReferralsModule {}
