import {
	Controller,
	Get,
	Post,
	Delete,
	Body,
	Param,
	Query,
	UseGuards,
	ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';
import { AttachmentService } from './attachment.service';
import { AttachmentQueryDto, CreateAttachmentDto, UploadUrlDto } from './dto/attachment.dto';

@Controller()
@UseGuards(JwtAuthGuard)
export class AttachmentController {
	constructor(private readonly attachmentService: AttachmentService) {}

	@Get('emails/:emailId/attachments')
	async findByEmail(
		@CurrentUser() user: CurrentUserData,
		@Param('emailId', ParseUUIDPipe) emailId: string
	) {
		const attachments = await this.attachmentService.findByEmailId(emailId, user.userId);
		return { attachments };
	}

	@Get('attachments/:id')
	async findOne(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		const attachment = await this.attachmentService.findById(id, user.userId);
		if (!attachment) {
			return { attachment: null };
		}
		return { attachment };
	}

	@Post('attachments')
	async create(@CurrentUser() user: CurrentUserData, @Body() dto: CreateAttachmentDto) {
		const attachment = await this.attachmentService.create({
			...dto,
			userId: user.userId,
		});
		return { attachment };
	}

	@Delete('attachments/:id')
	async delete(@CurrentUser() user: CurrentUserData, @Param('id', ParseUUIDPipe) id: string) {
		await this.attachmentService.delete(id, user.userId);
		return { success: true };
	}

	// Get presigned URL for client-side upload
	@Post('attachments/upload-url')
	async getUploadUrl(@CurrentUser() user: CurrentUserData, @Body() dto: UploadUrlDto) {
		const result = await this.attachmentService.getUploadUrl(user.userId, dto);
		return result;
	}

	// Get presigned URL for downloading
	@Get('attachments/:id/download')
	async getDownloadUrl(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string
	) {
		const result = await this.attachmentService.getDownloadUrl(id, user.userId);
		return result;
	}

	// Mark attachment as uploaded (called after client uploads to presigned URL)
	@Post('attachments/:id/complete')
	async markUploaded(
		@CurrentUser() user: CurrentUserData,
		@Param('id', ParseUUIDPipe) id: string,
		@Body() body: { storageKey: string }
	) {
		const attachment = await this.attachmentService.markUploaded(id, user.userId, body.storageKey);
		return { attachment };
	}
}
