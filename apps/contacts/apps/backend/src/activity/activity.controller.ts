import {
	Controller,
	Get,
	Post,
	Body,
	Param,
	Query,
	UseGuards,
	ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { ActivityService, ActivityType } from './activity.service';
import { IsString, IsOptional, IsIn, IsObject } from 'class-validator';
import { Transform } from 'class-transformer';

class CreateActivityDto {
	@IsString()
	@IsIn(['created', 'updated', 'called', 'emailed', 'met', 'note_added'])
	activityType!: ActivityType;

	@IsString()
	@IsOptional()
	description?: string;

	@IsObject()
	@IsOptional()
	metadata?: Record<string, unknown>;
}

class ActivityQueryDto {
	@IsOptional()
	@Transform(({ value }) => parseInt(value, 10))
	limit?: number;
}

@Controller('contacts/:contactId/activities')
@UseGuards(JwtAuthGuard)
export class ActivityController {
	constructor(private readonly activityService: ActivityService) {}

	@Get()
	async findAll(
		@CurrentUser() user: CurrentUserData,
		@Param('contactId', ParseUUIDPipe) contactId: string,
		@Query() query: ActivityQueryDto
	) {
		const activities = await this.activityService.findByContactId(
			contactId,
			user.userId,
			query.limit
		);
		return { activities };
	}

	@Post()
	async create(
		@CurrentUser() user: CurrentUserData,
		@Param('contactId', ParseUUIDPipe) contactId: string,
		@Body() dto: CreateActivityDto
	) {
		const activity = await this.activityService.logActivity(
			contactId,
			user.userId,
			dto.activityType,
			dto.description,
			dto.metadata
		);
		return { activity };
	}
}
