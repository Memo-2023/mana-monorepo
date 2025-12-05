import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ShareService } from './share.service';
import { CreateShareDto } from './share.dto';
import { JwtAuthGuard, CurrentUser, CurrentUserData } from '@manacore/shared-nestjs-auth';

@Controller('share')
export class ShareController {
	constructor(private readonly shareService: ShareService) {}

	// Public endpoint - no auth required
	@Get(':code')
	async getSharedDeck(@Param('code') code: string) {
		return this.shareService.findByShareCode(code);
	}

	// Authenticated endpoints
	@Post('deck/:deckId')
	@UseGuards(JwtAuthGuard)
	async createShare(
		@Param('deckId') deckId: string,
		@Body() createShareDto: CreateShareDto,
		@CurrentUser() user: CurrentUserData
	) {
		const expiresAt = createShareDto.expiresAt ? new Date(createShareDto.expiresAt) : undefined;
		return this.shareService.createShare(deckId, user.userId, expiresAt);
	}

	@Get('deck/:deckId/links')
	@UseGuards(JwtAuthGuard)
	async getSharesForDeck(@Param('deckId') deckId: string, @CurrentUser() user: CurrentUserData) {
		return this.shareService.getSharesForDeck(deckId, user.userId);
	}

	@Delete(':shareId')
	@UseGuards(JwtAuthGuard)
	async deleteShare(@Param('shareId') shareId: string, @CurrentUser() user: CurrentUserData) {
		return this.shareService.deleteShare(shareId, user.userId);
	}
}
