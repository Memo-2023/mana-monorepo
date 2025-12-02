import { IsOptional, IsIn, IsDateString } from 'class-validator';

export class UpdateShareDto {
	@IsOptional()
	@IsIn(['read', 'write', 'admin'])
	permission?: 'read' | 'write' | 'admin';

	@IsOptional()
	@IsDateString()
	expiresAt?: string | null;
}
