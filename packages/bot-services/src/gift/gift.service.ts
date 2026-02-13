import { Injectable, Inject, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	CreateGiftOptions,
	CreateGiftResult,
	GiftCodeInfo,
	RedeemGiftResult,
	CreatedGiftItem,
	ReceivedGiftItem,
	GiftModuleOptions,
	GiftStatusMessage,
	GIFT_MODULE_OPTIONS,
} from './types';

/**
 * Shared gift code management service for Matrix bots
 *
 * Provides gift code creation, redemption, and listing
 * for gifting credits between users via Matrix chat.
 *
 * @example
 * ```typescript
 * // In NestJS module
 * imports: [GiftModule.register({ authUrl: 'http://mana-core-auth:3001' })]
 *
 * // In service/controller
 * const gift = await giftService.createGift(token, 50, { message: 'Happy birthday!' });
 * const result = await giftService.redeemGift(token, 'ABC123');
 * ```
 */
@Injectable()
export class GiftService {
	private readonly logger = new Logger(GiftService.name);
	private readonly authUrl: string;

	constructor(
		@Optional() private configService: ConfigService,
		@Optional() @Inject(GIFT_MODULE_OPTIONS) private options?: GiftModuleOptions
	) {
		// Priority: module options > config > environment > default
		this.authUrl =
			options?.authUrl ||
			this.configService?.get<string>('auth.url') ||
			this.configService?.get<string>('MANA_CORE_AUTH_URL') ||
			'http://localhost:3001';

		this.logger.log(`Gift service initialized with auth URL: ${this.authUrl}`);
	}

	/**
	 * Create a new gift code
	 *
	 * @param token - User's JWT token
	 * @param credits - Total credits to gift
	 * @param options - Gift options (type, portions, message, etc.)
	 * @returns Created gift code info
	 */
	async createGift(
		token: string,
		credits: number,
		options?: CreateGiftOptions
	): Promise<CreateGiftResult | null> {
		try {
			const response = await fetch(`${this.authUrl}/api/v1/gifts`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					credits,
					...options,
					sourceAppId: 'matrix-bot',
				}),
			});

			if (!response.ok) {
				const error = await response.json().catch(() => ({}));
				this.logger.warn(`Failed to create gift: ${response.status}`, error);
				return null;
			}

			return (await response.json()) as CreateGiftResult;
		} catch (error) {
			this.logger.error('Error creating gift:', error);
			return null;
		}
	}

	/**
	 * Get gift code info (public, for preview)
	 *
	 * @param code - The gift code
	 * @returns Gift code info or null if not found
	 */
	async getGiftInfo(code: string): Promise<GiftCodeInfo | null> {
		try {
			const response = await fetch(`${this.authUrl}/api/v1/gifts/${code}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				if (response.status === 404) {
					return null;
				}
				this.logger.warn(`Failed to get gift info: ${response.status}`);
				return null;
			}

			return (await response.json()) as GiftCodeInfo;
		} catch (error) {
			this.logger.error('Error getting gift info:', error);
			return null;
		}
	}

	/**
	 * Redeem a gift code
	 *
	 * @param token - User's JWT token
	 * @param code - The gift code to redeem
	 * @param answer - Riddle answer (if required)
	 * @param matrixUserId - Matrix user ID (for personalized gifts)
	 * @returns Redemption result
	 */
	async redeemGift(
		token: string,
		code: string,
		answer?: string,
		matrixUserId?: string
	): Promise<RedeemGiftResult> {
		try {
			const headers: Record<string, string> = {
				Authorization: `Bearer ${token}`,
				'Content-Type': 'application/json',
			};

			if (matrixUserId) {
				headers['X-Matrix-User-Id'] = matrixUserId;
			}

			const response = await fetch(`${this.authUrl}/api/v1/gifts/${code}/redeem`, {
				method: 'POST',
				headers,
				body: JSON.stringify({
					answer,
					sourceAppId: 'matrix-bot',
				}),
			});

			if (!response.ok && response.status !== 200) {
				const errorData = (await response.json().catch(() => ({}))) as { message?: string };
				return {
					success: false,
					error: errorData.message || 'Failed to redeem gift code',
				};
			}

			return (await response.json()) as RedeemGiftResult;
		} catch (error) {
			this.logger.error('Error redeeming gift:', error);
			return {
				success: false,
				error: 'Service temporarily unavailable',
			};
		}
	}

	/**
	 * Cancel a gift code and get refund
	 *
	 * @param token - User's JWT token
	 * @param codeId - Gift code ID to cancel
	 * @returns Refunded credits amount
	 */
	async cancelGift(token: string, codeId: string): Promise<{ refundedCredits: number } | null> {
		try {
			const response = await fetch(`${this.authUrl}/api/v1/gifts/${codeId}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				this.logger.warn(`Failed to cancel gift: ${response.status}`);
				return null;
			}

			return (await response.json()) as { refundedCredits: number };
		} catch (error) {
			this.logger.error('Error cancelling gift:', error);
			return null;
		}
	}

	/**
	 * List gift codes created by the user
	 *
	 * @param token - User's JWT token
	 * @returns List of created gifts
	 */
	async listCreatedGifts(token: string): Promise<CreatedGiftItem[]> {
		try {
			const response = await fetch(`${this.authUrl}/api/v1/gifts/me/created`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				this.logger.warn(`Failed to list created gifts: ${response.status}`);
				return [];
			}

			return (await response.json()) as CreatedGiftItem[];
		} catch (error) {
			this.logger.error('Error listing created gifts:', error);
			return [];
		}
	}

	/**
	 * List gifts received by the user
	 *
	 * @param token - User's JWT token
	 * @returns List of received gifts
	 */
	async listReceivedGifts(token: string): Promise<ReceivedGiftItem[]> {
		try {
			const response = await fetch(`${this.authUrl}/api/v1/gifts/me/received`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				this.logger.warn(`Failed to list received gifts: ${response.status}`);
				return [];
			}

			return (await response.json()) as ReceivedGiftItem[];
		} catch (error) {
			this.logger.error('Error listing received gifts:', error);
			return [];
		}
	}

	// ============================================================================
	// MESSAGE FORMATTING HELPERS
	// ============================================================================

	/**
	 * Format a gift created success message
	 */
	formatGiftCreatedMessage(gift: CreateGiftResult): GiftStatusMessage {
		const lines: string[] = [];
		const htmlLines: string[] = [];

		lines.push('🎁 **Geschenk erstellt!**');
		htmlLines.push('🎁 <b>Geschenk erstellt!</b>');

		lines.push('');
		htmlLines.push('<br>');

		lines.push(`Code: \`${gift.code}\``);
		htmlLines.push(`Code: <code>${gift.code}</code>`);

		lines.push(`Credits: ${gift.creditsPerPortion}${gift.totalPortions > 1 ? ` × ${gift.totalPortions}` : ''}`);
		htmlLines.push(`Credits: ${gift.creditsPerPortion}${gift.totalPortions > 1 ? ` × ${gift.totalPortions}` : ''}`);

		lines.push('');
		htmlLines.push('<br>');

		lines.push(`Link: ${gift.url}`);
		htmlLines.push(`Link: <a href="${gift.url}">${gift.url}</a>`);

		return {
			text: lines.join('\n'),
			html: htmlLines.join('<br>'),
		};
	}

	/**
	 * Format a gift redeemed success message
	 */
	formatGiftRedeemedMessage(
		credits: number,
		newBalance: number,
		message?: string
	): GiftStatusMessage {
		const lines: string[] = [];
		const htmlLines: string[] = [];

		lines.push('🎁 **Geschenk eingelöst!**');
		htmlLines.push('🎁 <b>Geschenk eingelöst!</b>');

		lines.push(`+${credits} Credits`);
		htmlLines.push(`+${credits} Credits`);

		if (message) {
			lines.push('');
			lines.push(`"${message}"`);
			htmlLines.push('<br>');
			htmlLines.push(`<i>"${message}"</i>`);
		}

		lines.push('');
		lines.push(`Neuer Kontostand: ${newBalance.toFixed(2)} Credits`);
		htmlLines.push('<br>');
		htmlLines.push(`Neuer Kontostand: ${newBalance.toFixed(2)} Credits`);

		return {
			text: lines.join('\n'),
			html: htmlLines.join('<br>'),
		};
	}

	/**
	 * Format gift list message
	 */
	formatGiftListMessage(gifts: CreatedGiftItem[]): GiftStatusMessage {
		const lines: string[] = [];
		const htmlLines: string[] = [];

		lines.push('🎁 **Deine Geschenke:**');
		htmlLines.push('🎁 <b>Deine Geschenke:</b>');

		lines.push('');
		htmlLines.push('<br>');

		if (gifts.length === 0) {
			lines.push('Keine aktiven Geschenke.');
			htmlLines.push('Keine aktiven Geschenke.');
		} else {
			gifts.forEach((gift, index) => {
				const statusIcon = gift.status === 'active' ? '✅' : gift.status === 'depleted' ? '✓' : '❌';
				const claimed = `${gift.claimedPortions}/${gift.totalPortions}`;

				lines.push(`${index + 1}. \`${gift.code}\` ${statusIcon} ${gift.creditsPerPortion} Cr · ${claimed}`);
				htmlLines.push(`${index + 1}. <code>${gift.code}</code> ${statusIcon} ${gift.creditsPerPortion} Cr · ${claimed}`);
			});
		}

		return {
			text: lines.join('\n'),
			html: htmlLines.join('<br>'),
		};
	}

	/**
	 * Format gift code info message (for preview before redeeming)
	 */
	formatGiftInfoMessage(info: GiftCodeInfo): GiftStatusMessage {
		const lines: string[] = [];
		const htmlLines: string[] = [];

		lines.push('🎁 **Geschenk-Info:**');
		htmlLines.push('🎁 <b>Geschenk-Info:</b>');

		lines.push(`Credits: ${info.creditsPerPortion}`);
		htmlLines.push(`Credits: ${info.creditsPerPortion}`);

		if (info.totalPortions > 1) {
			lines.push(`Verfügbar: ${info.remainingPortions}/${info.totalPortions}`);
			htmlLines.push(`Verfügbar: ${info.remainingPortions}/${info.totalPortions}`);
		}

		if (info.message) {
			lines.push('');
			lines.push(`"${info.message}"`);
			htmlLines.push('<br>');
			htmlLines.push(`<i>"${info.message}"</i>`);
		}

		if (info.hasRiddle) {
			lines.push('');
			lines.push(`❓ ${info.riddleQuestion}`);
			lines.push('Antworte mit: `!einloesen CODE antwort`');
			htmlLines.push('<br>');
			htmlLines.push(`❓ ${info.riddleQuestion}`);
			htmlLines.push('Antworte mit: <code>!einloesen CODE antwort</code>');
		}

		if (info.creatorName) {
			lines.push('');
			lines.push(`Von: ${info.creatorName}`);
			htmlLines.push('<br>');
			htmlLines.push(`Von: ${info.creatorName}`);
		}

		return {
			text: lines.join('\n'),
			html: htmlLines.join('<br>'),
		};
	}
}
