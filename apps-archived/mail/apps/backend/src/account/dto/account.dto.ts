import {
	IsString,
	IsOptional,
	IsEmail,
	IsBoolean,
	IsNumber,
	IsIn,
	MaxLength,
	Min,
	Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateImapAccountDto {
	@IsString()
	@MaxLength(255)
	name: string;

	@IsEmail()
	@MaxLength(255)
	email: string;

	// IMAP settings
	@IsString()
	@MaxLength(255)
	imapHost: string;

	@IsNumber()
	@Min(1)
	@Max(65535)
	imapPort: number;

	@IsString()
	@IsIn(['ssl', 'tls', 'none'])
	imapSecurity: string;

	// SMTP settings
	@IsString()
	@MaxLength(255)
	smtpHost: string;

	@IsNumber()
	@Min(1)
	@Max(65535)
	smtpPort: number;

	@IsString()
	@IsIn(['ssl', 'tls', 'none'])
	smtpSecurity: string;

	// Credentials
	@IsString()
	password: string;

	@IsBoolean()
	@IsOptional()
	isDefault?: boolean;

	@IsString()
	@IsOptional()
	@MaxLength(7)
	color?: string;

	@IsString()
	@IsOptional()
	signature?: string;
}

export class UpdateAccountDto {
	@IsString()
	@IsOptional()
	@MaxLength(255)
	name?: string;

	@IsBoolean()
	@IsOptional()
	isDefault?: boolean;

	@IsBoolean()
	@IsOptional()
	syncEnabled?: boolean;

	@IsNumber()
	@IsOptional()
	@Min(1)
	@Max(60)
	syncInterval?: number;

	@IsString()
	@IsOptional()
	@MaxLength(7)
	color?: string;

	@IsString()
	@IsOptional()
	signature?: string;
}

export class AccountQueryDto {
	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	limit?: number;

	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	offset?: number;
}
