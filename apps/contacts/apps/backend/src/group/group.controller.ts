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
import { GroupService } from './group.service';
import { IsString, IsOptional, MaxLength, IsArray, IsUUID } from 'class-validator';

class CreateGroupDto {
	@IsString()
	@MaxLength(100)
	name!: string;

	@IsString()
	@IsOptional()
	description?: string;

	@IsString()
	@IsOptional()
	@MaxLength(20)
	color?: string;
}

class UpdateGroupDto {
	@IsString()
	@IsOptional()
	@MaxLength(100)
	name?: string;

	@IsString()
	@IsOptional()
	description?: string;

	@IsString()
	@IsOptional()
	@MaxLength(20)
	color?: string;
}

class AddContactsDto {
	@IsArray()
	@IsUUID('4', { each: true })
	contactIds!: string[];
}

@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupController {
	constructor(private readonly groupService: GroupService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData) {
		const groups = await this.groupService.findByUserId(user.userId);
		return { groups };
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		const group = await this.groupService.findById(id, user.userId);
		const contactIds = group ? await this.groupService.getContactsInGroup(id) : [];
		return { group, contactIds };
	}

	@Post()
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateGroupDto) {
		const group = await this.groupService.create({
			...dto,
			userId: user.userId,
		});
		return { group };
	}

	@Patch(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateGroupDto
	) {
		const group = await this.groupService.update(id, user.userId, dto);
		return { group };
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		await this.groupService.delete(id, user.userId);
		return { success: true };
	}

	@Post(':id/contacts')
	async addContacts(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: AddContactsDto
	) {
		// Verify group belongs to user
		const group = await this.groupService.findById(id, user.userId);
		if (!group) {
			return { success: false, error: 'Group not found' };
		}

		for (const contactId of dto.contactIds) {
			await this.groupService.addContactToGroup(contactId, id);
		}

		return { success: true };
	}

	@Delete(':id/contacts/:contactId')
	async removeContact(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Param('contactId', ParseUUIDPipe) contactId: string
	) {
		// Verify group belongs to user
		const group = await this.groupService.findById(id, user.userId);
		if (!group) {
			return { success: false, error: 'Group not found' };
		}

		await this.groupService.removeContactFromGroup(contactId, id);
		return { success: true };
	}
}
