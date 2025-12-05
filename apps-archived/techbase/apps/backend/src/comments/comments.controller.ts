import { Controller, Post, Get, Patch, Delete, Body, Param, Req } from '@nestjs/common';
import { Request } from 'express';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('comments')
export class CommentsController {
	constructor(private readonly commentsService: CommentsService) {}

	@Post()
	async createComment(@Body() createCommentDto: CreateCommentDto, @Req() req: Request) {
		const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
		return this.commentsService.createComment(
			createCommentDto.softwareId,
			createCommentDto.userName,
			createCommentDto.comment,
			ipAddress
		);
	}

	@Get(':softwareId')
	async getComments(@Param('softwareId') softwareId: string) {
		return this.commentsService.getApprovedComments(softwareId);
	}
}

@Controller('admin/comments')
export class AdminCommentsController {
	constructor(private readonly commentsService: CommentsService) {}

	@Get()
	async getAllComments() {
		return this.commentsService.getAllComments();
	}

	@Get('pending')
	async getPendingComments() {
		return this.commentsService.getPendingComments();
	}

	@Patch(':id/approve')
	async approveComment(@Param('id') id: string) {
		// TODO: Get actual moderator ID from auth
		return this.commentsService.approveComment(id, 'admin');
	}

	@Patch(':id/reject')
	async rejectComment(@Param('id') id: string) {
		// TODO: Get actual moderator ID from auth
		return this.commentsService.rejectComment(id, 'admin');
	}

	@Delete(':id')
	async deleteComment(@Param('id') id: string) {
		return this.commentsService.deleteComment(id);
	}
}
