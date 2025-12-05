import { IsString, IsOptional, IsUUID, IsBoolean, MaxLength, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateFolderDto {
	@IsUUID()
	accountId: string;

	@IsString()
	@MaxLength(255)
	name: string;

	@IsString()
	@IsOptional()
	@MaxLength(7)
	color?: string;

	@IsString()
	@IsOptional()
	@MaxLength(50)
	icon?: string;
}

export class UpdateFolderDto {
	@IsString()
	@IsOptional()
	@MaxLength(255)
	name?: string;

	@IsString()
	@IsOptional()
	@MaxLength(7)
	color?: string;

	@IsString()
	@IsOptional()
	@MaxLength(50)
	icon?: string;

	@IsBoolean()
	@IsOptional()
	isHidden?: boolean;
}

export class FolderQueryDto {
	@IsUUID()
	@IsOptional()
	accountId?: string;

	@IsString()
	@IsOptional()
	@IsIn(['inbox', 'sent', 'drafts', 'trash', 'spam', 'archive', 'custom'])
	type?: string;

	@IsOptional()
	@Transform(({ value }) => value === 'true')
	includeHidden?: boolean;
}
