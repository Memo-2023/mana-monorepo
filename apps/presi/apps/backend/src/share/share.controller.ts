import {
	Controller,
	Get,
	Post,
	Delete,
	Body,
	Param,
	UseGuards,
	ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ShareService } from './share.service';
import { CreateShareDto } from './share.dto';
import { JwtAuthGuard, CurrentUser } from '@manacore/shared-nestjs-auth';
import type { CurrentUserData } from '@manacore/shared-nestjs-auth';

@ApiTags('Share')
@Controller('share')
export class ShareController {
	constructor(private readonly shareService: ShareService) {}

	@Get(':code')
	async getSharedDeck(@Param('code') code: string) {
		return this.shareService.findByShareCode(code);
	}

	@ApiBearerAuth()
	@Post('deck/:deckId')
	@UseGuards(JwtAuthGuard)
	async createShare(
		@Param('deckId', ParseUUIDPipe) deckId: string,
		@Body() createShareDto: CreateShareDto,
		@CurrentUser() user: CurrentUserData
	) {
		const expiresAt = createShareDto.expiresAt ? new Date(createShareDto.expiresAt) : undefined;
		return this.shareService.createShare(deckId, user.userId, expiresAt);
	}

	@ApiBearerAuth()
	@Get('deck/:deckId/links')
	@UseGuards(JwtAuthGuard)
	async getSharesForDeck(
		@Param('deckId', ParseUUIDPipe) deckId: string,
		@CurrentUser() user: CurrentUserData
	) {
		return this.shareService.getSharesForDeck(deckId, user.userId);
	}

	@ApiBearerAuth()
	@Delete(':shareId')
	@UseGuards(JwtAuthGuard)
	async deleteShare(
		@Param('shareId', ParseUUIDPipe) shareId: string,
		@CurrentUser() user: CurrentUserData
	) {
		return this.shareService.deleteShare(shareId, user.userId);
	}
}
