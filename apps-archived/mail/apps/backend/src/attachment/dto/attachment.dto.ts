import { IsString, IsOptional, IsUUID, IsNumber, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class AttachmentQueryDto {
	@IsUUID()
	@IsOptional()
	emailId?: string;

	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	limit?: number;

	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	offset?: number;
}

export class CreateAttachmentDto {
	@IsUUID()
	emailId: string;

	@IsString()
	filename: string;

	@IsString()
	mimeType: string;

	@IsNumber()
	size: number;

	@IsString()
	@IsOptional()
	contentId?: string;
}

export class UploadUrlDto {
	@IsString()
	filename: string;

	@IsString()
	mimeType: string;

	@IsNumber()
	size: number;
}
