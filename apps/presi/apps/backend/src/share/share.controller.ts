import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ShareService } from './share.service';
import { CreateShareDto } from './share.dto';
import { AuthGuard } from '../auth/auth.guard';

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
	@UseGuards(AuthGuard)
	async createShare(
		@Param('deckId') deckId: string,
		@Body() createShareDto: CreateShareDto,
		@Request() req: { user: { sub: string } }
	) {
		const expiresAt = createShareDto.expiresAt ? new Date(createShareDto.expiresAt) : undefined;
		return this.shareService.createShare(deckId, req.user.sub, expiresAt);
	}

	@Get('deck/:deckId/links')
	@UseGuards(AuthGuard)
	async getSharesForDeck(
		@Param('deckId') deckId: string,
		@Request() req: { user: { sub: string } }
	) {
		return this.shareService.getSharesForDeck(deckId, req.user.sub);
	}

	@Delete(':shareId')
	@UseGuards(AuthGuard)
	async deleteShare(@Param('shareId') shareId: string, @Request() req: { user: { sub: string } }) {
		return this.shareService.deleteShare(shareId, req.user.sub);
	}
}
