/**
 * Types for credit management in Matrix bots
 */

/**
 * User credit balance information
 */
export interface CreditBalance {
	/** Current credit balance */
	balance: number;
	/** Whether user has enough credits for basic operations */
	hasCredits: boolean;
	/** User's tier (if applicable) */
	tier?: string;
}

/**
 * Result of a credit validation check
 */
export interface CreditValidationResult {
	/** Whether user has enough credits */
	hasCredits: boolean;
	/** Available credits */
	availableCredits: number;
	/** Required credits for the operation */
	requiredCredits: number;
	/** Error message if not enough credits */
	error?: string;
}

/**
 * Result of a credit consumption operation
 */
export interface CreditConsumeResult {
	/** Whether credits were successfully consumed */
	success: boolean;
	/** New balance after consumption */
	newBalance?: number;
	/** Error message if failed */
	error?: string;
}

/**
 * Credit module configuration options
 */
export interface CreditModuleOptions {
	/** Mana Core Auth URL */
	authUrl?: string;
	/** Service key for credit operations */
	serviceKey?: string;
	/** App ID for credit operations */
	appId?: string;
}

export const CREDIT_MODULE_OPTIONS = 'CREDIT_MODULE_OPTIONS';

/**
 * Credit error codes for structured error handling
 */
export enum CreditErrorCode {
	INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',
	NOT_LOGGED_IN = 'NOT_LOGGED_IN',
	SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
	INVALID_OPERATION = 'INVALID_OPERATION',
}

/**
 * Formatted credit message for Matrix bots
 */
export interface CreditStatusMessage {
	/** Plain text message */
	text: string;
	/** HTML formatted message (for Matrix) */
	html: string;
}
