import {
	GiftService,
	I18nService,
	SessionService,
	type CreateGiftOptions,
	type GiftCodeType,
} from '@manacore/bot-services';
import { type MatrixRoomEvent } from '../base/types';

/**
 * Commands that the gift mixin handles
 */
export const GIFT_COMMANDS = [
	'geschenk',
	'gift',
	'einloesen',
	'redeem',
	'meine-geschenke',
	'my-gifts',
] as const;

export type GiftCommand = (typeof GIFT_COMMANDS)[number];

/**
 * Check if a command is a gift command
 */
export function isGiftCommand(command: string): command is GiftCommand {
	return GIFT_COMMANDS.includes(command.toLowerCase() as GiftCommand);
}

/**
 * Interface for classes that can use the gift commands mixin
 */
export interface GiftCommandsHost {
	giftService: GiftService;
	i18nService: I18nService;
	sessionService: SessionService;

	/**
	 * Send a message to a room (for gift notifications)
	 */
	sendGiftMessage(roomId: string, message: string): Promise<void>;

	/**
	 * Send a reply to an event (for gift commands)
	 */
	sendGiftReply(roomId: string, event: MatrixRoomEvent, message: string): Promise<void>;
}

/**
 * Parsed gift command input
 */
interface ParsedGiftInput {
	credits: number;
	type: GiftCodeType;
	portions?: number;
	targetEmail?: string;
	targetMatrixId?: string;
	riddleQuestion?: string;
	riddleAnswer?: string;
	message?: string;
	expiresAt?: string;
}

/**
 * Parse gift command syntax
 *
 * Syntax examples:
 * - `!geschenk 50` - Simple, 50 credits
 * - `!geschenk 100 /5` - Split: 5 portions of 20 credits
 * - `!geschenk 50 x3` - First come: first 3 get 50 each
 * - `!geschenk 50 @user@email.com` - Personalized
 * - `!geschenk 50 @morgen` - Expires tomorrow
 * - `!geschenk 50 ?="answer"` - With riddle
 * - `!geschenk 50 "message"` - With message
 */
function parseGiftInput(input: string): ParsedGiftInput | null {
	const trimmed = input.trim();
	if (!trimmed) return null;

	// Extract credits (first number)
	const creditsMatch = trimmed.match(/^(\d+)/);
	if (!creditsMatch) return null;

	const credits = parseInt(creditsMatch[1], 10);
	if (isNaN(credits) || credits < 1 || credits > 10000) return null;

	const result: ParsedGiftInput = {
		credits,
		type: 'simple',
	};

	const rest = trimmed.substring(creditsMatch[0].length).trim();

	// Check for split: /N
	const splitMatch = rest.match(/\/(\d+)/);
	if (splitMatch) {
		result.type = 'split';
		result.portions = parseInt(splitMatch[1], 10);
	}

	// Check for first come: xN
	const firstComeMatch = rest.match(/x(\d+)/i);
	if (firstComeMatch) {
		result.type = 'first_come';
		result.portions = parseInt(firstComeMatch[1], 10);
	}

	// Check for personalized: @email
	const emailMatch = rest.match(/@([\w.+-]+@[\w.-]+\.\w+)/);
	if (emailMatch) {
		result.type = 'personalized';
		result.targetEmail = emailMatch[1];
	}

	// Check for Matrix ID: @user:server
	const matrixMatch = rest.match(/@(@[\w.-]+:[.\w-]+)/);
	if (matrixMatch && !emailMatch) {
		result.type = 'personalized';
		result.targetMatrixId = matrixMatch[1];
	}

	// Check for riddle: ?="answer"
	const riddleMatch = rest.match(/\?="([^"]+)"/);
	if (riddleMatch) {
		result.type = 'riddle';
		result.riddleAnswer = riddleMatch[1];
		// Riddle question will be the remaining text before the riddle
		const riddleQuestionMatch = rest.match(/\?([^=]+)="[^"]+"/);
		if (riddleQuestionMatch) {
			result.riddleQuestion = riddleQuestionMatch[1].trim();
		}
	}

	// Check for expiration: @morgen, @tomorrow
	const dateKeywords: Record<string, number> = {
		morgen: 1,
		tomorrow: 1,
		übermorgen: 2,
		'day after tomorrow': 2,
	};
	for (const [keyword, days] of Object.entries(dateKeywords)) {
		if (rest.toLowerCase().includes(`@${keyword}`)) {
			const date = new Date();
			date.setDate(date.getDate() + days);
			date.setHours(23, 59, 59, 999);
			result.expiresAt = date.toISOString();
			break;
		}
	}

	// Check for message: "message"
	const messageMatch = rest.match(/"([^"]+)"/);
	if (messageMatch && !riddleMatch) {
		result.message = messageMatch[1];
	}

	return result;
}

/**
 * Handle a gift command if applicable
 * @returns true if the command was handled, false otherwise
 */
export async function handleGiftCommand(
	host: GiftCommandsHost,
	roomId: string,
	event: MatrixRoomEvent,
	userId: string,
	command: string,
	args: string
): Promise<boolean> {
	const cmd = command.toLowerCase();

	switch (cmd) {
		case 'geschenk':
		case 'gift':
			await handleCreateGift(host, roomId, event, userId, args);
			return true;

		case 'einloesen':
		case 'redeem':
			await handleRedeemGift(host, roomId, event, userId, args);
			return true;

		case 'meine-geschenke':
		case 'my-gifts':
			await handleListGifts(host, roomId, event, userId);
			return true;

		default:
			return false;
	}
}

/**
 * Handle !geschenk / !gift command - create a gift
 */
async function handleCreateGift(
	host: GiftCommandsHost,
	roomId: string,
	event: MatrixRoomEvent,
	userId: string,
	args: string
): Promise<void> {
	const token = await host.sessionService.getToken(userId);
	const t = await host.i18nService.getGiftTranslator(userId);

	if (!token) {
		await sendReply(host, roomId, event, t('loginRequired'));
		return;
	}

	// Parse input
	const parsed = parseGiftInput(args);
	if (!parsed) {
		await sendReply(host, roomId, event, t('giftInvalidSyntax'));
		return;
	}

	// Build options
	const options: CreateGiftOptions = {
		type: parsed.type,
		portions: parsed.portions,
		targetEmail: parsed.targetEmail,
		targetMatrixId: parsed.targetMatrixId,
		riddleQuestion: parsed.riddleQuestion,
		riddleAnswer: parsed.riddleAnswer,
		message: parsed.message,
		expiresAt: parsed.expiresAt,
	};

	// Create gift
	const result = await host.giftService.createGift(token, parsed.credits, options);

	if (!result) {
		await sendReply(host, roomId, event, t('giftInsufficientCredits', { available: '?' }));
		return;
	}

	// Format response
	const lines: string[] = [t('giftCreated'), ''];

	lines.push(t('giftCreatedCode', { code: result.code }));

	if (result.totalPortions > 1) {
		lines.push(
			t('giftCreatedSplit', {
				credits: String(result.creditsPerPortion),
				portions: String(result.totalPortions),
			})
		);
	} else {
		lines.push(t('giftCreatedCredits', { credits: String(result.totalCredits) }));
	}

	lines.push('');
	lines.push(t('giftCreatedLink', { url: result.url }));

	await sendReply(host, roomId, event, lines.join('\n'));
}

/**
 * Handle !einloesen / !redeem command - redeem a gift
 */
async function handleRedeemGift(
	host: GiftCommandsHost,
	roomId: string,
	event: MatrixRoomEvent,
	userId: string,
	args: string
): Promise<void> {
	const token = await host.sessionService.getToken(userId);
	const t = await host.i18nService.getGiftTranslator(userId);

	if (!token) {
		await sendReply(host, roomId, event, t('loginRequired'));
		return;
	}

	// Parse args: CODE [answer]
	const parts = args.trim().split(/\s+/);
	const code = parts[0]?.toUpperCase();
	const answer = parts.slice(1).join(' ');

	if (!code) {
		await sendReply(host, roomId, event, t('giftInvalidSyntax'));
		return;
	}

	// Check if it looks like a gift code
	if (code.length !== 6 || !/^[A-Z0-9]+$/.test(code)) {
		// Try to extract code from URL
		const urlMatch = args.match(/\/g\/([A-Z0-9]{6})/i);
		if (urlMatch) {
			// Recurse with extracted code
			await handleRedeemGift(host, roomId, event, userId, urlMatch[1]);
			return;
		}

		await sendReply(host, roomId, event, t('giftInvalidCode'));
		return;
	}

	// First, get gift info to check if riddle required
	if (!answer) {
		const info = await host.giftService.getGiftInfo(code);
		if (info?.hasRiddle && info.riddleQuestion) {
			// Show riddle question
			const lines: string[] = [
				t('giftInfoTitle'),
				t('giftRiddleQuestion', { question: info.riddleQuestion }),
				'',
				`\`!einloesen ${code} [antwort]\``,
			];
			await sendReply(host, roomId, event, lines.join('\n'));
			return;
		}
	}

	// Redeem gift
	// Get Matrix user ID from event sender
	const matrixUserId = event.sender;

	const result = await host.giftService.redeemGift(token, code, answer || undefined, matrixUserId);

	if (!result.success) {
		// Map error to translation
		const errorMessages: Record<string, string> = {
			'Gift code not found': t('giftInvalidCode'),
			'This gift code has expired': t('giftExpired'),
			'This gift code has been fully claimed': t('giftDepleted'),
			'You have already claimed this gift': t('giftAlreadyClaimed'),
			'This gift code is for a specific person': t('giftWrongUser'),
			'Incorrect answer': t('giftWrongAnswer'),
			'Please provide the answer to the riddle': t('giftRiddleRequired'),
		};

		const errorMsg = errorMessages[result.error || ''] || result.error || t('errorOccurred');
		await sendReply(host, roomId, event, errorMsg);
		return;
	}

	// Format success response
	const lines: string[] = [t('giftRedeemed')];
	lines.push(t('giftRedeemedCredits', { credits: String(result.credits) }));

	if (result.message) {
		lines.push('');
		lines.push(t('giftRedeemedMessage', { message: result.message }));
	}

	if (result.newBalance !== undefined) {
		lines.push('');
		lines.push(t('creditNewBalance', { balance: result.newBalance.toFixed(2) }));
	}

	await sendReply(host, roomId, event, lines.join('\n'));
}

/**
 * Handle !meine-geschenke / !my-gifts command - list user's gifts
 */
async function handleListGifts(
	host: GiftCommandsHost,
	roomId: string,
	event: MatrixRoomEvent,
	userId: string
): Promise<void> {
	const token = await host.sessionService.getToken(userId);
	const t = await host.i18nService.getGiftTranslator(userId);

	if (!token) {
		await sendReply(host, roomId, event, t('loginRequired'));
		return;
	}

	const gifts = await host.giftService.listCreatedGifts(token);

	const lines: string[] = [t('giftListTitle'), ''];

	if (gifts.length === 0) {
		lines.push(t('giftListEmpty'));
	} else {
		// Show only active or recently depleted
		const relevantGifts = gifts.filter(
			(g) => g.status === 'active' || g.status === 'depleted'
		);

		relevantGifts.forEach((gift, index) => {
			const statusIcon =
				gift.status === 'active' ? '✅' : gift.status === 'depleted' ? '✓' : '❌';

			lines.push(
				t('giftListItem', {
					num: String(index + 1),
					code: gift.code,
					status: statusIcon,
					credits: String(gift.creditsPerPortion),
					claimed: String(gift.claimedPortions),
					total: String(gift.totalPortions),
				})
			);
		});
	}

	await sendReply(host, roomId, event, lines.join('\n'));
}

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Send a message to a room
 */
async function sendMessage(host: GiftCommandsHost, roomId: string, message: string): Promise<void> {
	await host.sendGiftMessage(roomId, message);
}

/**
 * Send a reply to an event
 */
async function sendReply(
	host: GiftCommandsHost,
	roomId: string,
	event: MatrixRoomEvent,
	message: string
): Promise<void> {
	await host.sendGiftReply(roomId, event, message);
}
