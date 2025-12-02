import {
	Controller,
	Get,
	Post,
	Patch,
	Delete,
	Body,
	Param,
	UseGuards,
	ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { TagService } from './tag.service';
import { IsString, IsOptional, MaxLength } from 'class-validator';

class CreateTagDto {
	@IsString()
	@MaxLength(50)
	name!: string;

	@IsString()
	@IsOptional()
	@MaxLength(20)
	color?: string;
}

class UpdateTagDto {
	@IsString()
	@IsOptional()
	@MaxLength(50)
	name?: string;

	@IsString()
	@IsOptional()
	@MaxLength(20)
	color?: string;
}

@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagController {
	constructor(private readonly tagService: TagService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		const tags = await this.tagService.findByUserId(user.userId);
		return { tags };
	}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateTagDto) {
		const tag = await this.tagService.create({
			...dto,
			userId: user.userId,
		});
		return { tag };
	}

	@Patch(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateTagDto
	) {
		const tag = await this.tagService.update(id, user.userId, dto);
		return { tag };
	}

	@Delete(':id')
	async delete(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string
	) {
		await this.tagService.delete(id, user.userId);
		return { success: true };
	}
}
