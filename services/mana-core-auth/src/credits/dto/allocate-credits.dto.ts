import { IsUUID, IsInt, IsString, IsOptional, Min } from 'class-validator';

export class AllocateCreditsDto {
	@IsString()
	organizationId: string;

	@IsUUID()
	employeeId: string;

	@IsInt()
	@Min(1)
	amount: number;

	@IsString()
	@IsOptional()
	reason?: string;
}
