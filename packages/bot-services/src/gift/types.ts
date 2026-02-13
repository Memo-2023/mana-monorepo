/**
 * Types for gift code management in Matrix bots
 */

/**
 * Gift code types
 */
export type GiftCodeType = 'simple' | 'personalized' | 'split' | 'first_come' | 'riddle';

/**
 * Gift code status
 */
export type GiftCodeStatus = 'active' | 'depleted' | 'expired' | 'cancelled' | 'refunded';

/**
 * Options for creating a gift code
 */
export interface CreateGiftOptions {
	/** Gift type (default: 'simple') */
	type?: GiftCodeType;
	/** Number of portions for split/first_come (default: 1) */
	portions?: number;
	/** Target email for personalized gifts */
	targetEmail?: string;
	/** Target Matrix ID for personalized gifts */
	targetMatrixId?: string;
	/** Riddle question */
	riddleQuestion?: string;
	/** Riddle answer */
	riddleAnswer?: string;
	/** Optional message */
	message?: string;
	/** Expiration date (ISO string) */
	expiresAt?: string;
}

/**
 * Result of creating a gift code
 */
export interface CreateGiftResult {
	/** Gift code ID */
	id: string;
	/** The gift code (6 chars) */
	code: string;
	/** Short URL (mana.how/g/CODE) */
	url: string;
	/** Total credits reserved */
	totalCredits: number;
	/** Credits per portion */
	creditsPerPortion: number;
	/** Total number of portions */
	totalPortions: number;
	/** Gift type */
	type: GiftCodeType;
	/** Expiration date */
	expiresAt?: string;
}

/**
 * Gift code info (public, for preview)
 */
export interface GiftCodeInfo {
	/** The gift code */
	code: string;
	/** Gift type */
	type: GiftCodeType;
	/** Current status */
	status: GiftCodeStatus;
	/** Credits per portion */
	creditsPerPortion: number;
	/** Total portions */
	totalPortions: number;
	/** Claimed portions */
	claimedPortions: number;
	/** Remaining portions */
	remainingPortions: number;
	/** Optional message */
	message?: string;
	/** Riddle question (if riddle type) */
	riddleQuestion?: string;
	/** Whether gift has a riddle */
	hasRiddle: boolean;
	/** Whether gift is for a specific person */
	isPersonalized: boolean;
	/** Expiration date */
	expiresAt?: string;
	/** Creator name */
	creatorName?: string;
}

/**
 * Result of redeeming a gift code
 */
export interface RedeemGiftResult {
	/** Whether redemption was successful */
	success: boolean;
	/** Credits received (if successful) */
	credits?: number;
	/** Gift message (if any) */
	message?: string;
	/** Error message (if failed) */
	error?: string;
	/** New credit balance */
	newBalance?: number;
}

/**
 * Gift code in user's created list
 */
export interface CreatedGiftItem {
	/** Gift code ID */
	id: string;
	/** The gift code */
	code: string;
	/** Short URL */
	url: string;
	/** Gift type */
	type: GiftCodeType;
	/** Current status */
	status: GiftCodeStatus;
	/** Total credits reserved */
	totalCredits: number;
	/** Credits per portion */
	creditsPerPortion: number;
	/** Total portions */
	totalPortions: number;
	/** Claimed portions */
	claimedPortions: number;
	/** Optional message */
	message?: string;
	/** Expiration date */
	expiresAt?: string;
	/** Creation date */
	createdAt: string;
}

/**
 * Gift in user's received list
 */
export interface ReceivedGiftItem {
	/** Redemption ID */
	id: string;
	/** The gift code */
	code: string;
	/** Credits received */
	credits: number;
	/** Gift message */
	message?: string;
	/** Creator name */
	creatorName?: string;
	/** When redeemed */
	redeemedAt: string;
}

/**
 * Gift module configuration options
 */
export interface GiftModuleOptions {
	/** Mana Core Auth URL */
	authUrl?: string;
}

export const GIFT_MODULE_OPTIONS = 'GIFT_MODULE_OPTIONS';

/**
 * Formatted gift message for Matrix bots
 */
export interface GiftStatusMessage {
	/** Plain text message */
	text: string;
	/** HTML formatted message (for Matrix) */
	html: string;
}
