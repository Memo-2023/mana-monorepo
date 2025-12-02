import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateFolderDto {
	@IsString()
	@MaxLength(255)
	name: string;

	@IsOptional()
	@IsUUID()
	parentFolderId?: string;

	@IsOptional()
	@IsString()
	@MaxLength(20)
	color?: string;

	@IsOptional()
	@IsString()
	description?: string;
}
