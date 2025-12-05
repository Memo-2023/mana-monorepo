import {
	IsString,
	IsOptional,
	IsUUID,
	IsArray,
	IsDateString,
	ValidateNested,
	IsEmail,
	IsIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class EmailAddressDto {
	@IsEmail()
	email: string;

	@IsString()
	@IsOptional()
	name?: string;
}

export class CreateDraftDto {
	@IsUUID()
	accountId: string;

	@IsString()
	@IsOptional()
	subject?: string;

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => EmailAddressDto)
	@IsOptional()
	toAddresses?: EmailAddressDto[];

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => EmailAddressDto)
	@IsOptional()
	ccAddresses?: EmailAddressDto[];

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => EmailAddressDto)
	@IsOptional()
	bccAddresses?: EmailAddressDto[];

	@IsString()
	@IsOptional()
	bodyHtml?: string;

	@IsString()
	@IsOptional()
	bodyPlain?: string;

	@IsUUID()
	@IsOptional()
	replyToEmailId?: string;

	@IsString()
	@IsOptional()
	@IsIn(['reply', 'reply-all', 'forward'])
	replyType?: string;

	@IsDateString()
	@IsOptional()
	scheduledAt?: string;
}

export class UpdateDraftDto {
	@IsString()
	@IsOptional()
	subject?: string;

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => EmailAddressDto)
	@IsOptional()
	toAddresses?: EmailAddressDto[];

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => EmailAddressDto)
	@IsOptional()
	ccAddresses?: EmailAddressDto[];

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => EmailAddressDto)
	@IsOptional()
	bccAddresses?: EmailAddressDto[];

	@IsString()
	@IsOptional()
	bodyHtml?: string;

	@IsString()
	@IsOptional()
	bodyPlain?: string;

	@IsDateString()
	@IsOptional()
	scheduledAt?: string;
}

export class SendEmailDto {
	@IsUUID()
	accountId: string;

	@IsString()
	@IsOptional()
	subject?: string;

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => EmailAddressDto)
	toAddresses: EmailAddressDto[];

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => EmailAddressDto)
	@IsOptional()
	ccAddresses?: EmailAddressDto[];

	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => EmailAddressDto)
	@IsOptional()
	bccAddresses?: EmailAddressDto[];

	@IsString()
	@IsOptional()
	bodyHtml?: string;

	@IsString()
	@IsOptional()
	bodyPlain?: string;

	@IsUUID()
	@IsOptional()
	replyToEmailId?: string;

	@IsString()
	@IsOptional()
	@IsIn(['reply', 'reply-all', 'forward'])
	replyType?: string;
}

export class DraftQueryDto {
	@IsUUID()
	@IsOptional()
	accountId?: string;

	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	limit?: number;

	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	offset?: number;
}
