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
import { EventTagService } from './event-tag.service';
import { CreateEventTagDto } from './dto/create-event-tag.dto';
import { UpdateEventTagDto } from './dto/update-event-tag.dto';

@Controller('event-tags')
@UseGuards(JwtAuthGuard)
export class EventTagController {
	constructor(private readonly eventTagService: EventTagService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		const tags = await this.eventTagService.findByUserId(user.userId);
		return { tags };
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		const tag = await this.eventTagService.findById(id, user.userId);
		if (!tag) {
			throw new NotFoundException('Tag not found');
		}
		return { tag };
	}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateEventTagDto) {
		const tag = await this.eventTagService.create({
			...dto,
			userId: user.userId,
		});
		return { tag };
	}

	@Put(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateEventTagDto
	) {
		const tag = await this.eventTagService.update(id, user.userId, dto);
		return { tag };
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		await this.eventTagService.delete(id, user.userId);
		return { success: true };
	}
}
