import { IsString, IsUUID, IsArray, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTagLinkDto {
	@IsUUID()
	tagId: string;

	@IsString()
	@MaxLength(50)
	appId: string;

	@IsString()
	@MaxLength(255)
	entityId: string;

	@IsString()
	@MaxLength(100)
	entityType: string;
}

export class BulkCreateTagLinksDto {
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreateTagLinkDto)
	links: CreateTagLinkDto[];
}

export class SyncTagLinksDto {
	@IsString()
	@MaxLength(50)
	appId: string;

	@IsString()
	@MaxLength(255)
	entityId: string;

	@IsString()
	@MaxLength(100)
	entityType: string;

	@IsArray()
	@IsUUID('4', { each: true })
	tagIds: string[];
}
