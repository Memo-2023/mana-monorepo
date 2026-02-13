import { IsString, IsOptional, MaxLength } from 'class-validator';

export class RedeemGiftDto {
	/**
	 * Riddle answer (required if gift has a riddle)
	 */
	@IsOptional()
	@IsString()
	@MaxLength(100)
	answer?: string;

	/**
	 * Source app ID (for tracking)
	 */
	@IsOptional()
	@IsString()
	sourceAppId?: string;
}

export class GiftCodeInfoResponse {
	code: string;
	type: string;
	status: string;
	creditsPerPortion: number;
	totalPortions: number;
	claimedPortions: number;
	remainingPortions: number;
	message?: string;
	riddleQuestion?: string;
	hasRiddle: boolean;
	isPersonalized: boolean;
	expiresAt?: string;
	creatorName?: string;
}

export class GiftRedeemResponse {
	success: boolean;
	credits?: number;
	message?: string;
	error?: string;
	newBalance?: number;
}

export class CreateGiftResponse {
	id: string;
	code: string;
	url: string;
	totalCredits: number;
	creditsPerPortion: number;
	totalPortions: number;
	type: string;
	expiresAt?: string;
}

export class GiftListItem {
	id: string;
	code: string;
	url: string;
	type: string;
	status: string;
	totalCredits: number;
	creditsPerPortion: number;
	totalPortions: number;
	claimedPortions: number;
	message?: string;
	expiresAt?: string;
	createdAt: string;
}

export class ReceivedGiftItem {
	id: string;
	code: string;
	credits: number;
	message?: string;
	creatorName?: string;
	redeemedAt: string;
}
