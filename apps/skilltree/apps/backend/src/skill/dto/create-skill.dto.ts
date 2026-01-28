import { IsString, IsOptional, IsIn, MaxLength, IsUUID } from 'class-validator';
import type { SkillBranch } from '../../db/schema';

const BRANCHES = ['intellect', 'body', 'creativity', 'social', 'practical', 'mindset', 'custom'] as const;

export class CreateSkillDto {
	@IsString()
	@MaxLength(200)
	name: string;

	@IsOptional()
	@IsString()
	@MaxLength(1000)
	description?: string;

	@IsIn(BRANCHES)
	branch: SkillBranch;

	@IsOptional()
	@IsUUID()
	parentId?: string;

	@IsOptional()
	@IsString()
	@MaxLength(50)
	icon?: string;

	@IsOptional()
	@IsString()
	@MaxLength(20)
	color?: string;
}
