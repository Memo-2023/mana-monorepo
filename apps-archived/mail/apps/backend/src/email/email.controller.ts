import {
	Controller,
	Get,
	Post,
	Patch,
	Delete,
	Body,
	Param,
	Query,
	UseGuards,
	ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { EmailService } from './email.service';
import {
	EmailQueryDto,
	UpdateEmailDto,
	MoveEmailDto,
	BatchEmailDto,
	UpdateLabelsDto,
} from './dto/email.dto';

@Controller('emails')
@UseGuards(JwtAuthGuard)
export class EmailController {
	constructor(private readonly emailService: EmailService) {}

	@Get()
	async findAll(@CurrentUser() user: CurrentUserData, @Query() query: EmailQueryDto) {
		const emails = await this.emailService.findByUserId(user.userId, query);
		const total = await this.emailService.count(user.userId, {
			accountId: query.accountId,
			folderId: query.folderId,
			isRead: query.isRead,
		});
		return { emails, total };
	}

	@Get('search')
	async search(@CurrentUser() user: CurrentUserData, @Query() query: EmailQueryDto) {
		if (!query.search) {
			return { emails: [], total: 0 };
		}
		const emails = await this.emailService.findByUserId(user.userId, query);
		return { emails, total: emails.length };
	}

	@Get(':id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		const email = await this.emailService.findById(id, user.userId);
		if (!email) {
			return { email: null };
		}

		// Automatically mark as read when viewing
		if (!email.isRead) {
			await this.emailService.markAsRead(id, user.userId);
		}

		return { email };
	}

	@Get(':id/thread')
	async getThread(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		const email = await this.emailService.findById(id, user.userId);
		if (!email || !email.threadId) {
			return { emails: email ? [email] : [] };
		}

		const emails = await this.emailService.findByThreadId(email.threadId, user.userId);
		return { emails };
	}

	@Patch(':id')
	async update(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateEmailDto
	) {
		const email = await this.emailService.update(id, user.userId, dto);
		return { email };
	}

	@Post(':id/read')
	async markAsRead(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		const email = await this.emailService.markAsRead(id, user.userId);
		return { email };
	}

	@Post(':id/unread')
	async markAsUnread(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		const email = await this.emailService.markAsUnread(id, user.userId);
		return { email };
	}

	@Post(':id/star')
	async toggleStar(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		const email = await this.emailService.toggleStar(id, user.userId);
		return { email };
	}

	@Post(':id/move')
	async move(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: MoveEmailDto
	) {
		const email = await this.emailService.moveToFolder(id, user.userId, dto.folderId);
		return { email };
	}

	@Post(':id/trash')
	async moveToTrash(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		const email = await this.emailService.moveToTrash(id, user.userId);
		return { email };
	}

	@Post(':id/spam')
	async markAsSpam(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		const email = await this.emailService.markAsSpam(id, user.userId);
		return { email };
	}

	@Post(':id/archive')
	async archive(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		const email = await this.emailService.archive(id, user.userId);
		return { email };
	}

	@Delete(':id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		// Soft delete (move to trash)
		const email = await this.emailService.moveToTrash(id, user.userId);
		return { success: true, email };
	}

	@Delete(':id/permanent')
	async permanentDelete(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string
	) {
		await this.emailService.permanentDelete(id, user.userId);
		return { success: true };
	}

	// Batch operations
	@Post('batch')
	async batchOperation(@CurrentUser() user: CurrentUserData, @Body() dto: BatchEmailDto) {
		let affected = 0;

		switch (dto.action) {
			case 'read':
				affected = await this.emailService.batchMarkAsRead(dto.ids, user.userId);
				break;
			case 'unread':
				affected = await this.emailService.batchMarkAsUnread(dto.ids, user.userId);
				break;
			case 'star':
				affected = await this.emailService.batchStar(dto.ids, user.userId, true);
				break;
			case 'unstar':
				affected = await this.emailService.batchStar(dto.ids, user.userId, false);
				break;
			case 'delete':
				affected = await this.emailService.batchDelete(dto.ids, user.userId);
				break;
			// TODO: Implement move and archive batch operations
		}

		return { success: true, affected };
	}
}
