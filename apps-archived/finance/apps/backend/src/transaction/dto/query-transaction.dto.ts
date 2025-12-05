import {
	IsString,
	IsOptional,
	IsBoolean,
	IsNumber,
	IsUUID,
	IsDateString,
	IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';

const TRANSACTION_TYPES = ['income', 'expense'] as const;

export class QueryTransactionDto {
	@IsOptional()
	@IsUUID()
	accountId?: string;

	@IsOptional()
	@IsUUID()
	categoryId?: string;

	@IsOptional()
	@IsString()
	@IsIn(TRANSACTION_TYPES)
	type?: (typeof TRANSACTION_TYPES)[number];

	@IsOptional()
	@IsDateString()
	startDate?: string;

	@IsOptional()
	@IsDateString()
	endDate?: string;

	@IsOptional()
	@Transform(({ value }) => parseFloat(value))
	@IsNumber()
	minAmount?: number;

	@IsOptional()
	@Transform(({ value }) => parseFloat(value))
	@IsNumber()
	maxAmount?: number;

	@IsOptional()
	@IsString()
	search?: string;

	@IsOptional()
	@Transform(({ value }) => value === 'true' || value === true)
	@IsBoolean()
	isPending?: boolean;

	@IsOptional()
	@Transform(({ value }) => value === 'true' || value === true)
	@IsBoolean()
	isRecurring?: boolean;

	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	@IsNumber()
	limit?: number;

	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	@IsNumber()
	offset?: number;
}
