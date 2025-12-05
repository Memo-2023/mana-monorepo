import { IsString, IsOptional, IsUUID, IsArray, Matches, MaxLength } from 'class-validator';

export class CreateLabelDto {
	@IsString()
	@MaxLength(100)
	name: string;

	@IsString()
	@Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex color (e.g., #FF5733)' })
	color: string;

	@IsUUID()
	@IsOptional()
	accountId?: string;
}

export class UpdateLabelDto {
	@IsString()
	@MaxLength(100)
	@IsOptional()
	name?: string;

	@IsString()
	@Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex color (e.g., #FF5733)' })
	@IsOptional()
	color?: string;
}

export class LabelQueryDto {
	@IsUUID()
	@IsOptional()
	accountId?: string;
}

export class AddLabelsDto {
	@IsArray()
	@IsUUID('4', { each: true })
	labelIds: string[];
}

export class RemoveLabelsDto {
	@IsArray()
	@IsUUID('4', { each: true })
	labelIds: string[];
}
