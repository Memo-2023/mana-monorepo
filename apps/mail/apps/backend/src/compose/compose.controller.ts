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
import { ComposeService } from './compose.service';
import { CreateDraftDto, UpdateDraftDto, SendEmailDto, DraftQueryDto } from './dto/compose.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class ComposeController {
	constructor(private readonly composeService: ComposeService) {}

	// ==================== Drafts ====================

	@Get('drafts')
	async findAllDrafts(@CurrentUser() user: CurrentUserData, @Query() query: DraftQueryDto) {
		const drafts = await this.composeService.findDraftsByUserId(user.userId, query);
		const total = await this.composeService.countDrafts(user.userId, query.accountId);
		return { drafts, total };
	}

	@Get('drafts/:id')
	async findDraft(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		const draft = await this.composeService.findDraftById(id, user.userId);
		if (!draft) {
			return { draft: null };
		}
		return { draft };
	}

	@Post('drafts')
	async createDraft(@CurrentUser() user: CurrentUserData, @Body() dto: CreateDraftDto) {
		const draft = await this.composeService.createDraft({
			...dto,
			userId: user.userId,
			scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
		});
		return { draft };
	}

	@Patch('drafts/:id')
	async updateDraft(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() dto: UpdateDraftDto
	) {
		const draft = await this.composeService.updateDraft(id, user.userId, {
			...dto,
			scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
		});
		return { draft };
	}

	@Delete('drafts/:id')
	async deleteDraft(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		await this.composeService.deleteDraft(id, user.userId);
		return { success: true };
	}

	@Post('drafts/:id/send')
	async sendDraft(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		const result = await this.composeService.sendDraft(id, user.userId);
		return result;
	}

	// ==================== Direct Send ====================

	@Post('send')
	async sendEmail(@CurrentUser() user: CurrentUserData, @Body() dto: SendEmailDto) {
		const result = await this.composeService.sendEmail(user.userId, dto);
		return result;
	}

	// ==================== Reply/Forward ====================

	@Post('emails/:id/reply')
	async createReply(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		const draft = await this.composeService.createReplyDraft(user.userId, id, 'reply');
		return { draft };
	}

	@Post('emails/:id/reply-all')
	async createReplyAll(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string
	) {
		const draft = await this.composeService.createReplyDraft(user.userId, id, 'reply-all');
		return { draft };
	}

	@Post('emails/:id/forward')
	async createForward(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string
	) {
		const draft = await this.composeService.createReplyDraft(user.userId, id, 'forward');
		return { draft };
	}
}
