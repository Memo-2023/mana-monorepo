import { IsString, MinLength, MaxLength } from 'class-validator';

/**
 * Reset Password DTO
 *
 * Request body for resetting password with token.
 */
export class ResetPasswordDto {
	/**
	 * Reset token from email link
	 */
	@IsString()
	token: string;

	/**
	 * New password (must meet password requirements)
	 */
	@IsString()
	@MinLength(8, { message: 'Password must be at least 8 characters long' })
	@MaxLength(128, { message: 'Password must be at most 128 characters long' })
	newPassword: string;
}
