import { CreditService, I18nService, SessionService, type CreditPackage } from '@manacore/bot-services';
import { type MatrixRoomEvent } from '../base/types';

/**
 * Commands that the credit mixin handles
 */
export const CREDIT_COMMANDS = [
	'credits',
	'guthaben',
	'packages',
	'pakete',
	'buy',
	'kaufen',
] as const;

export type CreditCommand = (typeof CREDIT_COMMANDS)[number];

/**
 * Check if a command is a credit command
 */
export function isCreditCommand(command: string): command is CreditCommand {
	return CREDIT_COMMANDS.includes(command.toLowerCase() as CreditCommand);
}

/**
 * Interface for classes that can use the credit commands mixin
 *
 * Bots implementing this interface should expose their protected
 * sendMessage/sendReply methods via these wrapper methods.
 */
export interface CreditCommandsHost {
	creditService: CreditService;
	i18nService: I18nService;
	sessionService: SessionService;

	/**
	 * Send a message to a room (for credit notifications)
	 */
	sendCreditMessage(roomId: string, message: string): Promise<void>;

	/**
	 * Send a reply to an event (for credit commands)
	 */
	sendCreditReply(roomId: string, event: MatrixRoomEvent, message: string): Promise<void>;
}

/**
 * Credit commands mixin for Matrix bots
 *
 * Provides handlers for credit-related commands:
 * - !credits / !guthaben - Show credit balance
 * - !packages / !pakete - Show available packages
 * - !buy N / !kaufen N - Purchase a package
 *
 * @example
 * ```typescript
 * // In your MatrixService class:
 *
 * @Injectable()
 * export class MatrixService extends BaseMatrixService implements CreditCommandsHost {
 *   public creditService: CreditService;
 *   public i18nService: I18nService;
 *   public sessionService: SessionService;
 *
 *   constructor(
 *     configService: ConfigService,
 *     creditService: CreditService,
 *     i18nService: I18nService,
 *     sessionService: SessionService,
 *   ) {
 *     super(configService);
 *     this.creditService = creditService;
 *     this.i18nService = i18nService;
 *     this.sessionService = sessionService;
 *   }
 *
 *   async executeCommand(roomId, event, userId, command, args) {
 *     // Handle credit commands first
 *     if (await handleCreditCommand(this, roomId, event, userId, command, args)) {
 *       return;
 *     }
 *     // Then handle bot-specific commands
 *     // ...
 *   }
 * }
 * ```
 */

/**
 * Handle a credit command if applicable
 * @returns true if the command was handled, false otherwise
 */
export async function handleCreditCommand(
	host: CreditCommandsHost,
	roomId: string,
	event: MatrixRoomEvent,
	userId: string,
	command: string,
	args: string
): Promise<boolean> {
	const cmd = command.toLowerCase();

	switch (cmd) {
		case 'credits':
		case 'guthaben':
			await handleCreditsCommand(host, roomId, event, userId);
			return true;

		case 'packages':
		case 'pakete':
			await handlePackagesCommand(host, roomId, event, userId);
			return true;

		case 'buy':
		case 'kaufen':
			await handleBuyCommand(host, roomId, event, userId, args);
			return true;

		default:
			return false;
	}
}

/**
 * Handle !credits / !guthaben command - show balance
 */
async function handleCreditsCommand(
	host: CreditCommandsHost,
	roomId: string,
	event: MatrixRoomEvent,
	userId: string
): Promise<void> {
	const token = await host.sessionService.getToken(userId);
	const t = await host.i18nService.getTodoTranslator(userId);

	if (!token) {
		await sendReply(host, roomId, event, t('loginRequired'));
		return;
	}

	const balance = await host.creditService.getBalance(token);
	const message = t('creditBalance', { balance: balance.balance.toFixed(2) });

	await sendReply(host, roomId, event, message);
}

/**
 * Handle !packages / !pakete command - show available packages
 */
async function handlePackagesCommand(
	host: CreditCommandsHost,
	roomId: string,
	event: MatrixRoomEvent,
	userId: string
): Promise<void> {
	const t = await host.i18nService.getTodoTranslator(userId);

	// Packages are public, no token needed
	const packages = await host.creditService.getPackages();

	if (packages.length === 0) {
		await sendReply(host, roomId, event, t('creditNoPackages'));
		return;
	}

	// Store packages for reference in buy command
	packageCache.set(userId, packages);

	const lines: string[] = [t('creditPackagesTitle'), ''];

	packages.forEach((pkg, index) => {
		lines.push(
			t('creditPackageLine', {
				num: String(index + 1),
				name: pkg.name,
				credits: String(pkg.credits),
				price: pkg.formattedPrice,
			})
		);
	});

	lines.push('');
	lines.push(t('creditBuyHelp', { num: '1' }));

	await sendReply(host, roomId, event, lines.join('\n'));
}

/**
 * Handle !buy N / !kaufen N command - purchase a package
 */
async function handleBuyCommand(
	host: CreditCommandsHost,
	roomId: string,
	event: MatrixRoomEvent,
	userId: string,
	args: string
): Promise<void> {
	const token = await host.sessionService.getToken(userId);
	const t = await host.i18nService.getTodoTranslator(userId);

	if (!token) {
		await sendReply(host, roomId, event, t('loginRequired'));
		return;
	}

	// Parse package number
	const packageNumber = parseInt(args.trim(), 10);
	if (isNaN(packageNumber) || packageNumber < 1) {
		await sendReply(host, roomId, event, t('creditPackageNotFound'));
		return;
	}

	// Get cached packages or fetch new ones
	let packages = packageCache.get(userId);
	if (!packages) {
		packages = await host.creditService.getPackages();
		packageCache.set(userId, packages);
	}

	// Get selected package
	const selectedPackage = packages[packageNumber - 1];
	if (!selectedPackage) {
		await sendReply(host, roomId, event, t('creditPackageNotFound'));
		return;
	}

	// Create payment link
	const result = await host.creditService.createPaymentLink(token, selectedPackage.id, roomId);

	if (!result) {
		await sendReply(host, roomId, event, t('creditPurchaseError'));
		return;
	}

	// Format success message
	const lines = [
		`**${selectedPackage.name}** (${selectedPackage.credits} Credits)`,
		'',
		t('creditPaymentLink'),
		result.url,
		'',
		t('creditLinkValid'),
	];

	await sendReply(host, roomId, event, lines.join('\n'));
}

/**
 * Send a payment success notification to a room
 * Called after webhook confirms payment
 */
export async function sendPaymentSuccessNotification(
	host: CreditCommandsHost,
	roomId: string,
	userId: string,
	credits: number,
	newBalance: number
): Promise<void> {
	const t = await host.i18nService.getTodoTranslator(userId);

	const lines = [
		t('creditPaymentSuccess', { credits: String(credits) }),
		t('creditNewBalance', { balance: newBalance.toFixed(2) }),
	];

	await sendMessage(host, roomId, lines.join('\n'));
}

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Simple cache for packages (per-user)
 * Cleared after 5 minutes
 */
const packageCache = new Map<string, CreditPackage[]>();

// Clear cache entries after 5 minutes
setInterval(
	() => {
		packageCache.clear();
	},
	5 * 60 * 1000
);

/**
 * Send a message to a room
 */
async function sendMessage(host: CreditCommandsHost, roomId: string, message: string): Promise<void> {
	await host.sendCreditMessage(roomId, message);
}

/**
 * Send a reply to an event
 */
async function sendReply(
	host: CreditCommandsHost,
	roomId: string,
	event: MatrixRoomEvent,
	message: string
): Promise<void> {
	await host.sendCreditReply(roomId, event, message);
}
