import {
	Controller,
	Get,
	Post,
	Delete,
	Body,
	Param,
	UseGuards,
	ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { DuplicatesService } from './duplicates.service';
import { IsArray, IsString, ArrayMinSize } from 'class-validator';

class MergeContactsDto {
	@IsString()
	primaryId: string;

	@IsArray()
	@IsString({ each: true })
	@ArrayMinSize(1)
	mergeIds: string[];
}

@Controller('duplicates')
@UseGuards(JwtAuthGuard)
export class DuplicatesController {
	constructor(private readonly duplicatesService: DuplicatesService) {}

	@Get()
	async findDuplicates(@CurrentUser() user: CurrentUserData) {
		const duplicates = await this.duplicatesService.findDuplicates(user.userId);
		return { duplicates, total: duplicates.length };
	}

	@Post('merge')
	async mergeContacts(@CurrentUser() user: CurrentUserData, @Body() dto: MergeContactsDto) {
		const result = await this.duplicatesService.mergeContacts(
			dto.primaryId,
			dto.mergeIds,
			user.userId
		);
		return result;
	}

	@Delete(':groupId/dismiss')
	async dismissDuplicate(@CurrentUser() user: CurrentUserData, @Param('groupId') groupId: string) {
		await this.duplicatesService.dismissDuplicate(groupId, user.userId);
		return { success: true };
	}
}
