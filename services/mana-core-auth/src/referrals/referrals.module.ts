/**
 * Referrals Module
 *
 * NestJS module for the referral system.
 * Provides services for:
 * - Referral code management
 * - Referral tracking and stage progression
 * - Tier calculation and bonus multipliers
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ReferralsController } from './referrals.controller';
import { ReferralCodeService } from './services/referral-code.service';
import { ReferralTierService } from './services/referral-tier.service';
import { ReferralTrackingService } from './services/referral-tracking.service';

@Module({
	imports: [ConfigModule],
	controllers: [ReferralsController],
	providers: [ReferralCodeService, ReferralTierService, ReferralTrackingService],
	exports: [ReferralCodeService, ReferralTierService, ReferralTrackingService],
})
export class ReferralsModule {}
