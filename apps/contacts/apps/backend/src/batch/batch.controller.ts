import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { BatchService } from './batch.service';
import { IsArray, IsString, IsBoolean, IsOptional, ArrayMinSize } from 'class-validator';

class BatchContactIdsDto {
	@IsArray()
	@IsString({ each: true })
	@ArrayMinSize(1)
	contactIds: string[];
}

class BatchArchiveDto extends BatchContactIdsDto {
	@IsBoolean()
	@IsOptional()
	archive?: boolean = true;
}

class BatchFavoriteDto extends BatchContactIdsDto {
	@IsBoolean()
	@IsOptional()
	favorite?: boolean = true;
}

class BatchTagsDto extends BatchContactIdsDto {
	@IsArray()
	@IsString({ each: true })
	@ArrayMinSize(1)
	tagIds: string[];
}

@Controller('batch')
@UseGuards(JwtAuthGuard)
export class BatchController {
	constructor(private readonly batchService: BatchService) {}

	@Post('delete')
	async deleteMany(@CurrentUser() user: CurrentUserData, @Body() dto: BatchContactIdsDto) {
		const result = await this.batchService.deleteMany(dto.contactIds, user.userId);
		return result;
	}

	@Post('archive')
	async archiveMany(@CurrentUser() user: CurrentUserData, @Body() dto: BatchArchiveDto) {
		const result = await this.batchService.archiveMany(
			dto.contactIds,
			user.userId,
			dto.archive ?? true
		);
		return result;
	}

	@Post('favorite')
	async favoriteMany(@CurrentUser() user: CurrentUserData, @Body() dto: BatchFavoriteDto) {
		const result = await this.batchService.favoriteMany(
			dto.contactIds,
			user.userId,
			dto.favorite ?? true
		);
		return result;
	}

	@Post('add-tags')
	async addTags(@CurrentUser() user: CurrentUserData, @Body() dto: BatchTagsDto) {
		const result = await this.batchService.addTags(dto.contactIds, dto.tagIds, user.userId);
		return result;
	}
}
