import {
	IsString,
	IsInt,
	IsPositive,
	IsOptional,
	IsObject,
	IsIn,
	ValidateNested,
	ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreditSourceDto {
	@IsIn(['personal', 'guild'])
	type: 'personal' | 'guild';

	@ValidateIf((o) => o.type === 'guild')
	@IsString()
	guildId?: string;
}

export class UseCreditsDto {
	@IsInt()
	@IsPositive()
	amount: number;

	@IsString()
	appId: string;

	@IsString()
	description: string;

	@IsString()
	@IsOptional()
	idempotencyKey?: string;

	@IsObject()
	@IsOptional()
	metadata?: Record<string, any>;

	@IsOptional()
	@ValidateNested()
	@Type(() => CreditSourceDto)
	creditSource?: CreditSourceDto;
}
