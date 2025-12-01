import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

/**
 * DTO for B2B organization registration
 *
 * Creates an organization with the registering user as owner.
 */
export class RegisterB2BDto {
	@IsEmail()
	ownerEmail: string;

	@IsString()
	@MinLength(12)
	@MaxLength(128)
	password: string;

	@IsString()
	@MaxLength(255)
	ownerName: string;

	@IsString()
	@MinLength(2)
	@MaxLength(255)
	organizationName: string;
}
