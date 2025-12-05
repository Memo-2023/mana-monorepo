import {
	IsString,
	IsNotEmpty,
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

const TRANSACTION_TYPES = ['income', 'expense'] as const;
const RECURRENCE_FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'] as const;

export class RecurrenceRuleDto {
	@IsString()
	@IsIn(RECURRENCE_FREQUENCIES)
	frequency: (typeof RECURRENCE_FREQUENCIES)[number];

	@IsNumber()
	interval: number;

	@IsOptional()
	@IsDateString()
	endDate?: string;

	@IsOptional()
	@IsNumber()
	count?: number;
}

export class CreateTransactionDto {
	@IsUUID()
	accountId: string;

	@IsOptional()
	@IsUUID()
	categoryId?: string;

	@IsString()
	@IsIn(TRANSACTION_TYPES)
	type: (typeof TRANSACTION_TYPES)[number];

	@IsNumber()
	amount: number;

	@IsDateString()
	date: string;

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
	recurrenceRule?: RecurrenceRuleDto;

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
