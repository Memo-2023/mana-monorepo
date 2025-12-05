import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class UpdateFolderDto {
	@IsOptional()
	@IsString()
	@MaxLength(255)
	name?: string;

	@IsOptional()
	@IsString()
	@MaxLength(20)
	color?: string;

	@IsOptional()
	@IsString()
	description?: string;
}

export class MoveFolderDto {
	@IsOptional()
	@IsUUID()
	parentFolderId?: string | null;
}
