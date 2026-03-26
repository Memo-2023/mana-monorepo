import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class QueryTagLinksDto {
	@IsOptional()
	@IsString()
	@MaxLength(50)
	appId?: string;

	@IsOptional()
	@IsString()
	@MaxLength(255)
	entityId?: string;

	@IsOptional()
	@IsString()
	@MaxLength(100)
	entityType?: string;

	@IsOptional()
	@IsUUID()
	tagId?: string;
}

export class GetTagsForEntityDto {
	@IsString()
	@MaxLength(50)
	appId: string;

	@IsString()
	@MaxLength(255)
	entityId: string;
}
