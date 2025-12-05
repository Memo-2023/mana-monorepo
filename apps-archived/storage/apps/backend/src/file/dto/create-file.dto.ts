import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateFileDto {
	@IsOptional()
	@IsUUID()
	parentFolderId?: string;
}

export class UpdateFileDto {
	@IsOptional()
	@IsString()
	@MaxLength(500)
	name?: string;
}

export class MoveFileDto {
	@IsOptional()
	@IsUUID()
	parentFolderId?: string | null;
}
