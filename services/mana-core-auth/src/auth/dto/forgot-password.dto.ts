import { IsEmail, IsOptional, IsString, IsUrl } from 'class-validator';

/**
 * Forgot Password DTO
 *
 * Request body for initiating password reset.
 */
export class ForgotPasswordDto {
	/**
	 * User's email address
	 */
	@IsEmail()
	email: string;

	/**
	 * Optional redirect URL after password reset
	 * The reset token will be appended as a query parameter
	 */
	@IsOptional()
	@IsString()
	redirectTo?: string;
}
