import {
	IsString,
	IsOptional,
	IsNumber,
	IsUUID,
	IsDateString,
	MaxLength,
	Min,
} from 'class-validator';

export class UpdateTransferDto {
	@IsOptional()
	@IsUUID()
	fromAccountId?: string;

	@IsOptional()
	@IsUUID()
	toAccountId?: string;

	@IsOptional()
	@IsNumber()
	@Min(0.01)
	amount?: number;

	@IsOptional()
	@IsDateString()
	date?: string;

	@IsOptional()
	@IsString()
	@MaxLength(500)
	description?: string;
}
