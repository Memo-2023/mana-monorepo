import { IsString, IsNumber, IsOptional, IsEmail, Min, Max, MaxLength, IsEnum } from 'class-validator';

export type GiftCodeType = 'simple' | 'personalized' | 'split' | 'first_come' | 'riddle';

export class CreateGiftDto {
	/**
	 * Total credits to gift
	 */
	@IsNumber()
	@Min(1, { message: 'Minimum 1 credit required' })
	@Max(10000, { message: 'Maximum 10000 credits allowed' })
	credits: number;

	/**
	 * Gift type
	 */
	@IsOptional()
	@IsEnum(['simple', 'personalized', 'split', 'first_come', 'riddle'])
	type?: GiftCodeType;

	/**
	 * Number of portions (for split/first_come)
	 * Default: 1
	 */
	@IsOptional()
	@IsNumber()
	@Min(1)
	@Max(100)
	portions?: number;

	/**
	 * Target email (for personalized)
	 */
	@IsOptional()
	@IsEmail()
	targetEmail?: string;

	/**
	 * Target Matrix ID (for personalized)
	 */
	@IsOptional()
	@IsString()
	targetMatrixId?: string;

	/**
	 * Riddle question (for riddle type)
	 */
	@IsOptional()
	@IsString()
	@MaxLength(200)
	riddleQuestion?: string;

	/**
	 * Riddle answer (will be hashed)
	 */
	@IsOptional()
	@IsString()
	@MaxLength(100)
	riddleAnswer?: string;

	/**
	 * Optional message to include
	 */
	@IsOptional()
	@IsString()
	@MaxLength(500)
	message?: string;

	/**
	 * Expiration date (ISO string)
	 */
	@IsOptional()
	@IsString()
	expiresAt?: string;

	/**
	 * Source app ID (for tracking)
	 */
	@IsOptional()
	@IsString()
	sourceAppId?: string;
}
