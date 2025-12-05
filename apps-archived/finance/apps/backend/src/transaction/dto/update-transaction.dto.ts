import {
	IsString,
	IsOptional,
	IsBoolean,
	IsNumber,
	IsUUID,
	IsDateString,
	IsArray,
	IsIn,
	ValidateNested,
	MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RecurrenceRuleDto } from './create-transaction.dto';

const TRANSACTION_TYPES = ['income', 'expense'] as const;

export class UpdateTransactionDto {
	@IsOptional()
	@IsUUID()
	accountId?: string;

	@IsOptional()
	@IsUUID()
	categoryId?: string | null;

	@IsOptional()
	@IsString()
	@IsIn(TRANSACTION_TYPES)
	type?: (typeof TRANSACTION_TYPES)[number];

	@IsOptional()
	@IsNumber()
	amount?: number;

	@IsOptional()
	@IsDateString()
	date?: string;

	@IsOptional()
	@IsString()
	@MaxLength(500)
	description?: string;

	@IsOptional()
	@IsString()
	@MaxLength(200)
	payee?: string;

	@IsOptional()
	@IsBoolean()
	isRecurring?: boolean;

	@IsOptional()
	@ValidateNested()
	@Type(() => RecurrenceRuleDto)
	recurrenceRule?: RecurrenceRuleDto | null;

	@IsOptional()
	@IsBoolean()
	isPending?: boolean;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	tags?: string[];

	@IsOptional()
	@IsString()
	@MaxLength(3)
	currency?: string;
}
