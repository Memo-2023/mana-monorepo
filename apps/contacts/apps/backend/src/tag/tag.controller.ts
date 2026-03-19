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
	NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { TagService } from './tag.service';
import { ContactService } from '../contact/contact.service';
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
	constructor(
		private readonly tagService: TagService,
		private readonly contactService: ContactService
	) {}

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
	async delete(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		await this.tagService.delete(id, user.userId);
		return { success: true };
	}

	@Post(':id/contacts/:contactId')
	async addToContact(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) tagId: string,
		@Param('contactId', ParseUUIDPipe) contactId: string
	) {
		// Verify tag belongs to user
		const tag = await this.tagService.findById(tagId, user.userId);
		if (!tag) {
			throw new NotFoundException('Tag not found');
		}
		// Verify contact belongs to user
		const contact = await this.contactService.findById(contactId, user.userId);
		if (!contact) {
			throw new NotFoundException('Contact not found');
		}
		await this.tagService.addTagToContact(contactId, tagId);
		return { success: true };
	}

	@Delete(':id/contacts/:contactId')
	async removeFromContact(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) tagId: string,
		@Param('contactId', ParseUUIDPipe) contactId: string
	) {
		// Verify tag belongs to user
		const tag = await this.tagService.findById(tagId, user.userId);
		if (!tag) {
			throw new NotFoundException('Tag not found');
		}
		// Verify contact belongs to user
		const contact = await this.contactService.findById(contactId, user.userId);
		if (!contact) {
			throw new NotFoundException('Contact not found');
		}
		await this.tagService.removeTagFromContact(contactId, tagId);
		return { success: true };
	}

	@Get('contact/:contactId')
	async getTagsForContact(
		@CurrentUser() user: CurrentUserData,
		@Param('contactId', ParseUUIDPipe) contactId: string
	) {
		const tagIds = await this.tagService.getTagsForContact(contactId);
		return { tagIds };
	}
}
