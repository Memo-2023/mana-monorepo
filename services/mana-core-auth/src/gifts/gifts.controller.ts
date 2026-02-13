import {
	Controller,
	Get,
	Post,
	Delete,
	Body,
	Param,
	UseGuards,
	Request,
	HttpCode,
	HttpStatus,
	NotFoundException,
} from '@nestjs/common';
import { GiftCodeService } from './services/gift-code.service';
import { CreateGiftDto } from './dto/create-gift.dto';
import { RedeemGiftDto } from './dto/redeem-gift.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('gifts')
export class GiftsController {
	constructor(private readonly giftCodeService: GiftCodeService) {}

	/**
	 * Get gift code info (public - no auth required)
	 * For displaying gift info before redeeming
	 */
	@Get(':code')
	async getGiftInfo(@Param('code') code: string) {
		const info = await this.giftCodeService.getGiftCodeInfo(code);
		if (!info) {
			throw new NotFoundException('Gift code not found');
		}
		return info;
	}

	/**
	 * Create a new gift code
	 */
	@Post()
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.CREATED)
	async createGift(@Request() req: any, @Body() dto: CreateGiftDto) {
		const userId = req.user.sub;
		return this.giftCodeService.createGiftCode(userId, dto);
	}

	/**
	 * Redeem a gift code
	 */
	@Post(':code/redeem')
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.OK)
	async redeemGift(@Request() req: any, @Param('code') code: string, @Body() dto: RedeemGiftDto) {
		const userId = req.user.sub;
		const userEmail = req.user.email;
		// Matrix ID would be passed in the request if coming from a Matrix bot
		const userMatrixId = req.headers['x-matrix-user-id'];

		return this.giftCodeService.redeemGiftCode(userId, code, dto, userEmail, userMatrixId);
	}

	/**
	 * List gift codes created by the authenticated user
	 */
	@Get('me/created')
	@UseGuards(JwtAuthGuard)
	async listCreatedGifts(@Request() req: any) {
		const userId = req.user.sub;
		return this.giftCodeService.listCreatedGifts(userId);
	}

	/**
	 * List gifts received by the authenticated user
	 */
	@Get('me/received')
	@UseGuards(JwtAuthGuard)
	async listReceivedGifts(@Request() req: any) {
		const userId = req.user.sub;
		return this.giftCodeService.listReceivedGifts(userId);
	}

	/**
	 * Cancel a gift code and get refund for unclaimed portions
	 */
	@Delete(':id')
	@UseGuards(JwtAuthGuard)
	@HttpCode(HttpStatus.OK)
	async cancelGift(@Request() req: any, @Param('id') id: string) {
		const userId = req.user.sub;
		return this.giftCodeService.cancelGiftCode(userId, id);
	}
}
