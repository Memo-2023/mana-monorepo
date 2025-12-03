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
import { NoteService } from './note.service';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

class CreateNoteDto {
	@IsString()
	content!: string;

	@IsBoolean()
	@IsOptional()
	isPinned?: boolean;
}

class UpdateNoteDto {
	@IsString()
	@IsOptional()
	content?: string;

	@IsBoolean()
	@IsOptional()
	isPinned?: boolean;
}

@Controller('contacts/:contactId/notes')
@UseGuards(JwtAuthGuard)
export class ContactNoteController {
	constructor(private readonly noteService: NoteService) {}

	@Get()
	async findAll(
		@CurrentUser() user: CurrentUserData,
		@Param('contactId', ParseUUIDPipe) contactId: string
	) {
		const notes = await this.noteService.findByContactId(contactId, user.userId);
		return { notes };
	}

	@Post()
	async create(
		@CurrentUser() user: CurrentUserData,
		@Param('contactId', ParseUUIDPipe) contactId: string,
		@Body() dto: CreateNoteDto
	) {
		const note = await this.noteService.create({
			...dto,
			contactId,
			userId: user.userId,
		});
		return { note };
	}
}

@Controller('notes')
@UseGuards(JwtAuthGuard)
export class NoteController {
	constructor(private readonly noteService: NoteService) {}

	@Patch(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateNoteDto
	) {
		const note = await this.noteService.update(id, user.userId, dto);
		return { note };
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		await this.noteService.delete(id, user.userId);
		return { success: true };
	}

	@Post(':id/pin')
	async togglePin(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		const note = await this.noteService.togglePin(id, user.userId);
		return { note };
	}
}
