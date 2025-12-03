import { IsString, IsOptional, IsUUID, IsBoolean, IsArray, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class EmailQueryDto {
	@IsUUID()
	@IsOptional()
	accountId?: string;

	@IsUUID()
	@IsOptional()
	folderId?: string;

	@IsUUID()
	@IsOptional()
	threadId?: string;

	@IsString()
	@IsOptional()
	search?: string;

	@IsOptional()
	@Transform(({ value }) => value === 'true')
	isRead?: boolean;

	@IsOptional()
	@Transform(({ value }) => value === 'true')
	isStarred?: boolean;

	@IsOptional()
	@Transform(({ value }) => value === 'true')
	hasAttachments?: boolean;

	@IsString()
	@IsOptional()
	@IsIn(['work', 'personal', 'newsletter', 'transactional', 'promotional', 'social'])
	aiCategory?: string;

	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	limit?: number;

	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	offset?: number;

	@IsString()
	@IsOptional()
	@IsIn(['receivedAt', 'sentAt', 'subject', 'fromAddress'])
	orderBy?: string;

	@IsString()
	@IsOptional()
	@IsIn(['asc', 'desc'])
	order?: 'asc' | 'desc';
}

export class UpdateEmailDto {
	@IsBoolean()
	@IsOptional()
	isRead?: boolean;

	@IsBoolean()
	@IsOptional()
	isStarred?: boolean;

	@IsBoolean()
	@IsOptional()
	isDeleted?: boolean;

	@IsBoolean()
	@IsOptional()
	isSpam?: boolean;
}

export class MoveEmailDto {
	@IsUUID()
	folderId: string;
}

export class BatchEmailDto {
	@IsArray()
	@IsUUID('4', { each: true })
	ids: string[];

	@IsString()
	@IsIn(['read', 'unread', 'star', 'unstar', 'delete', 'spam', 'archive'])
	action: string;

	@IsUUID()
	@IsOptional()
	folderId?: string; // For move action
}

export class UpdateLabelsDto {
	@IsArray()
	@IsUUID('4', { each: true })
	labelIds: string[];
}
