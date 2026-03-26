import { IsString, IsOptional, IsUUID } from 'class-validator';

export class QueryTagLinksDto {
	@IsOptional()
	@IsString()
	appId?: string;

	@IsOptional()
	@IsString()
	entityId?: string;

	@IsOptional()
	@IsString()
	entityType?: string;

	@IsOptional()
	@IsUUID()
	tagId?: string;
}
