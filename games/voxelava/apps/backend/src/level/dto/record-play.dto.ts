import { IsBoolean, IsOptional, IsNumber } from 'class-validator';

export class RecordPlayDto {
	@IsOptional()
	@IsBoolean()
	completed?: boolean;

	@IsOptional()
	@IsNumber()
	completionTime?: number;
}
