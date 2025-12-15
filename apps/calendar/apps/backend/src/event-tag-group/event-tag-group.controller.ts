import {
	Controller,
	Get,
	Post,
	Put,
	Delete,
	Body,
	Param,
	UseGuards,
	ParseUUIDPipe,
	NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { EventTagGroupService } from './event-tag-group.service';
import { CreateEventTagGroupDto, UpdateEventTagGroupDto, ReorderEventTagGroupsDto } from './dto';

@Controller('event-tag-groups')
@UseGuards(JwtAuthGuard)
export class EventTagGroupController {
	constructor(private readonly eventTagGroupService: EventTagGroupService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		const groups = await this.eventTagGroupService.findByUserId(user.userId);
		const tagCounts = await this.eventTagGroupService.getTagCountsForUser(user.userId);

		// Add tag count to each group
		const groupsWithCounts = groups.map((group) => ({
			...group,
			tagCount: tagCounts.get(group.id) ?? 0,
		}));

		return {
			groups: groupsWithCounts,
			ungroupedTagCount: tagCounts.get(null) ?? 0,
		};
	}

	@Put('reorder')
	async reorder(@CurrentUser() user: CurrentUserData, @Body() dto: ReorderEventTagGroupsDto) {
		const groups = await this.eventTagGroupService.reorder(user.userId, dto.groupIds);
		const tagCounts = await this.eventTagGroupService.getTagCountsForUser(user.userId);

		const groupsWithCounts = groups.map((group) => ({
			...group,
			tagCount: tagCounts.get(group.id) ?? 0,
		}));

		return {
			groups: groupsWithCounts,
			ungroupedTagCount: tagCounts.get(null) ?? 0,
		};
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		const group = await this.eventTagGroupService.findById(id, user.userId);
		if (!group) {
			throw new NotFoundException('Tag group not found');
		}

		const tagCount = await this.eventTagGroupService.getTagCountByGroup(id);
		return { group: { ...group, tagCount } };
	}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateEventTagGroupDto) {
		const group = await this.eventTagGroupService.create({
			...dto,
			userId: user.userId,
		});
		return { group: { ...group, tagCount: 0 } };
	}

	@Put(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateEventTagGroupDto
	) {
		const group = await this.eventTagGroupService.update(id, user.userId, dto);
		const tagCount = await this.eventTagGroupService.getTagCountByGroup(id);
		return { group: { ...group, tagCount } };
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		await this.eventTagGroupService.delete(id, user.userId);
		return { success: true };
	}
}
