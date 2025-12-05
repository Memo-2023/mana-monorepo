import {
	IsString,
	IsOptional,
	IsNumber,
	IsUUID,
	IsDateString,
	MaxLength,
	Min,
} from 'class-validator';

export class CreateTransferDto {
	@IsUUID()
	fromAccountId: string;

	@IsUUID()
	toAccountId: string;

	@IsNumber()
	@Min(0.01)
	amount: number;

	@IsDateString()
	date: string;

	@IsOptional()
	@IsString()
	@MaxLength(500)
	description?: string;
}
