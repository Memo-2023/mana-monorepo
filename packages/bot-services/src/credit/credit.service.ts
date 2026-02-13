import { Injectable, Inject, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
	CreditBalance,
	CreditValidationResult,
	CreditModuleOptions,
	CreditStatusMessage,
	CreditErrorCode,
	CreditPackage,
	PaymentLinkResult,
	PurchaseStatusResult,
	CREDIT_MODULE_OPTIONS,
} from './types';

/**
 * Shared credit management service for Matrix bots
 *
 * Provides credit balance queries, validation, and formatted messages
 * for displaying credit information in Matrix chat.
 *
 * @example
 * ```typescript
 * // In NestJS module
 * imports: [CreditModule.register({ authUrl: 'http://mana-core-auth:3001' })]
 *
 * // In service/controller
 * const balance = await creditService.getBalance(token);
 * const statusMsg = creditService.formatStatusMessage(balance);
 * ```
 */
@Injectable()
export class CreditService {
	private readonly logger = new Logger(CreditService.name);
	private readonly authUrl: string;
	private readonly serviceKey?: string;
	private readonly appId?: string;

	constructor(
		@Optional() private configService: ConfigService,
		@Optional() @Inject(CREDIT_MODULE_OPTIONS) private options?: CreditModuleOptions
	) {
		// Priority: module options > config > environment > default
		this.authUrl =
			options?.authUrl ||
			this.configService?.get<string>('auth.url') ||
			this.configService?.get<string>('MANA_CORE_AUTH_URL') ||
			'http://localhost:3001';

		this.serviceKey =
			options?.serviceKey || this.configService?.get<string>('MANA_CORE_SERVICE_KEY');

		this.appId = options?.appId || this.configService?.get<string>('APP_ID');

		this.logger.log(`Credit service initialized with auth URL: ${this.authUrl}`);
	}

	/**
	 * Get credit balance for a user
	 *
	 * @param token - User's JWT token
	 * @returns Credit balance information
	 */
	async getBalance(token: string): Promise<CreditBalance> {
		try {
			const response = await fetch(`${this.authUrl}/api/v1/credits/balance`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				this.logger.warn(`Failed to get credit balance: ${response.status}`);
				return { balance: 0, hasCredits: false };
			}

			const data = (await response.json()) as { balance?: number; tier?: string };
			const balance = data.balance ?? 0;

			return {
				balance,
				hasCredits: balance > 0,
				tier: data.tier,
			};
		} catch (error) {
			this.logger.error('Error getting credit balance:', error);
			return { balance: 0, hasCredits: false };
		}
	}

	/**
	 * Validate if user has enough credits for an operation
	 *
	 * @param token - User's JWT token
	 * @param requiredCredits - Credits required for the operation
	 * @returns Validation result
	 */
	async validateCredits(token: string, requiredCredits: number): Promise<CreditValidationResult> {
		const balance = await this.getBalance(token);

		return {
			hasCredits: balance.balance >= requiredCredits,
			availableCredits: balance.balance,
			requiredCredits,
			error:
				balance.balance < requiredCredits
					? `Nicht genug Credits. Benötigt: ${requiredCredits}, Vorhanden: ${balance.balance.toFixed(2)}`
					: undefined,
		};
	}

	/**
	 * Format credit balance as a status message for Matrix
	 *
	 * @param balance - Credit balance or number
	 * @returns Formatted message with text and HTML versions
	 */
	formatBalanceMessage(balance: CreditBalance | number): CreditStatusMessage {
		const credits = typeof balance === 'number' ? balance : balance.balance;
		const hasCredits = credits > 0;

		const icon = hasCredits ? '⚡' : '⚠️';
		const creditsFormatted = credits.toFixed(2);

		const text = `${icon} Credits: ${creditsFormatted}`;
		const html = `${icon} <b>Credits:</b> ${creditsFormatted}`;

		return { text, html };
	}

	/**
	 * Format a full status message with credit information
	 *
	 * @param email - User's email (logged in as)
	 * @param balance - Credit balance
	 * @param additionalInfo - Additional status info
	 * @returns Formatted status message
	 */
	formatStatusMessage(
		email: string,
		balance: CreditBalance,
		additionalInfo?: Record<string, string>
	): CreditStatusMessage {
		const lines: string[] = [];
		const htmlLines: string[] = [];

		// Header
		lines.push('🤖 Bot Status');
		htmlLines.push('<b>🤖 Bot Status</b>');

		// User info
		lines.push(`👤 User: ${email}`);
		htmlLines.push(`👤 <b>User:</b> ${email}`);

		// Credits
		const creditIcon = balance.hasCredits ? '⚡' : '⚠️';
		const creditsFormatted = balance.balance.toFixed(2);
		lines.push(`${creditIcon} Credits: ${creditsFormatted}`);
		htmlLines.push(`${creditIcon} <b>Credits:</b> ${creditsFormatted}`);

		// Tier if available
		if (balance.tier) {
			lines.push(`📊 Tier: ${balance.tier}`);
			htmlLines.push(`📊 <b>Tier:</b> ${balance.tier}`);
		}

		// Additional info
		if (additionalInfo) {
			for (const [key, value] of Object.entries(additionalInfo)) {
				lines.push(`${key}: ${value}`);
				htmlLines.push(`<b>${key}:</b> ${value}`);
			}
		}

		// Low credits warning
		if (balance.balance < 10 && balance.balance > 0) {
			lines.push('');
			lines.push('⚠️ Nur noch wenig Credits!');
			lines.push('👉 Credits kaufen: https://mana.how/credits');
			htmlLines.push('<br>');
			htmlLines.push('⚠️ <b>Nur noch wenig Credits!</b>');
			htmlLines.push('👉 <a href="https://mana.how/credits">Credits kaufen</a>');
		}

		// No credits warning
		if (!balance.hasCredits) {
			lines.push('');
			lines.push('❌ Keine Credits mehr!');
			lines.push('👉 Credits kaufen: https://mana.how/credits');
			htmlLines.push('<br>');
			htmlLines.push('❌ <b>Keine Credits mehr!</b>');
			htmlLines.push('👉 <a href="https://mana.how/credits">Credits kaufen</a>');
		}

		return {
			text: lines.join('\n'),
			html: htmlLines.join('<br>'),
		};
	}

	/**
	 * Format an error message for insufficient credits
	 *
	 * @param required - Required credits
	 * @param available - Available credits
	 * @param operation - Operation name (optional)
	 * @returns Formatted error message
	 */
	formatInsufficientCreditsError(
		required: number,
		available: number,
		operation?: string
	): CreditStatusMessage {
		const lines: string[] = [];
		const htmlLines: string[] = [];

		lines.push('❌ Nicht genug Credits');
		htmlLines.push('❌ <b>Nicht genug Credits</b>');

		if (operation) {
			lines.push(`Operation: ${operation}`);
			htmlLines.push(`<b>Operation:</b> ${operation}`);
		}

		lines.push(`Benötigt: ${required.toFixed(2)} Credits`);
		lines.push(`Vorhanden: ${available.toFixed(2)} Credits`);
		htmlLines.push(`<b>Benötigt:</b> ${required.toFixed(2)} Credits`);
		htmlLines.push(`<b>Vorhanden:</b> ${available.toFixed(2)} Credits`);

		lines.push('');
		lines.push('👉 Credits kaufen: https://mana.how/credits');
		htmlLines.push('<br>');
		htmlLines.push('👉 <a href="https://mana.how/credits">Credits kaufen</a>');

		return {
			text: lines.join('\n'),
			html: htmlLines.join('<br>'),
		};
	}

	/**
	 * Format a success message after credit consumption
	 *
	 * @param consumed - Credits consumed
	 * @param remaining - Remaining credits
	 * @param operation - Operation description (optional)
	 * @returns Formatted success message
	 */
	formatCreditConsumedMessage(
		consumed: number,
		remaining: number,
		operation?: string
	): CreditStatusMessage {
		const text = operation
			? `✅ ${operation}\n⚡ -${consumed.toFixed(2)} Credits (${remaining.toFixed(2)} verbleibend)`
			: `⚡ -${consumed.toFixed(2)} Credits (${remaining.toFixed(2)} verbleibend)`;

		const html = operation
			? `✅ ${operation}<br>⚡ -${consumed.toFixed(2)} Credits (${remaining.toFixed(2)} verbleibend)`
			: `⚡ -${consumed.toFixed(2)} Credits (${remaining.toFixed(2)} verbleibend)`;

		return { text, html };
	}

	/**
	 * Get error code from HTTP status
	 *
	 * @param status - HTTP status code
	 * @returns Credit error code
	 */
	getErrorCodeFromStatus(status: number): CreditErrorCode {
		switch (status) {
			case 401:
				return CreditErrorCode.NOT_LOGGED_IN;
			case 402:
				return CreditErrorCode.INSUFFICIENT_CREDITS;
			case 400:
				return CreditErrorCode.INVALID_OPERATION;
			default:
				return CreditErrorCode.SERVICE_UNAVAILABLE;
		}
	}

	/**
	 * Format a generic credit error message
	 *
	 * @param errorCode - Credit error code
	 * @returns Formatted error message
	 */
	formatErrorMessage(errorCode: CreditErrorCode): CreditStatusMessage {
		let text: string;
		let html: string;

		switch (errorCode) {
			case CreditErrorCode.INSUFFICIENT_CREDITS:
				text = '❌ Nicht genug Credits\n👉 Credits kaufen: https://mana.how/credits';
				html =
					'❌ <b>Nicht genug Credits</b><br>👉 <a href="https://mana.how/credits">Credits kaufen</a>';
				break;
			case CreditErrorCode.NOT_LOGGED_IN:
				text = '❌ Bitte zuerst einloggen: !login email passwort';
				html = '❌ <b>Bitte zuerst einloggen:</b> <code>!login email passwort</code>';
				break;
			case CreditErrorCode.INVALID_OPERATION:
				text = '❌ Ungültige Operation';
				html = '❌ <b>Ungültige Operation</b>';
				break;
			case CreditErrorCode.SERVICE_UNAVAILABLE:
			default:
				text = '❌ Service temporär nicht verfügbar. Bitte später erneut versuchen.';
				html = '❌ <b>Service temporär nicht verfügbar.</b> Bitte später erneut versuchen.';
				break;
		}

		return { text, html };
	}

	// ============================================================================
	// PACKAGE & PAYMENT LINK METHODS (for bot credit purchasing)
	// ============================================================================

	/**
	 * Get available credit packages
	 *
	 * @returns List of available credit packages
	 */
	async getPackages(): Promise<CreditPackage[]> {
		try {
			const response = await fetch(`${this.authUrl}/api/v1/credits/packages`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				this.logger.warn(`Failed to get packages: ${response.status}`);
				return [];
			}

			const packages = (await response.json()) as Array<{
				id: string;
				name: string;
				credits: number;
				priceEuroCents: number;
				sortOrder: number;
			}>;

			return packages.map((pkg) => ({
				id: pkg.id,
				name: pkg.name,
				credits: pkg.credits,
				priceEuroCents: pkg.priceEuroCents,
				formattedPrice: this.formatPrice(pkg.priceEuroCents),
				sortOrder: pkg.sortOrder,
			}));
		} catch (error) {
			this.logger.error('Error getting packages:', error);
			return [];
		}
	}

	/**
	 * Create a payment link for purchasing credits
	 *
	 * @param token - User's JWT token
	 * @param packageId - ID of the package to purchase
	 * @param roomId - Optional Matrix room ID for notification after payment
	 * @returns Payment link result with URL and expiration
	 */
	async createPaymentLink(
		token: string,
		packageId: string,
		roomId?: string
	): Promise<PaymentLinkResult | null> {
		try {
			const response = await fetch(`${this.authUrl}/api/v1/credits/payment-link`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					packageId,
					roomId,
				}),
			});

			if (!response.ok) {
				this.logger.warn(`Failed to create payment link: ${response.status}`);
				return null;
			}

			const result = (await response.json()) as {
				url: string;
				purchaseId: string;
				expiresAt: string;
				package: {
					name: string;
					credits: number;
					priceEuroCents: number;
				};
			};

			return {
				url: result.url,
				purchaseId: result.purchaseId,
				expiresAt: new Date(result.expiresAt),
				package: result.package,
			};
		} catch (error) {
			this.logger.error('Error creating payment link:', error);
			return null;
		}
	}

	/**
	 * Get purchase status
	 *
	 * @param token - User's JWT token
	 * @param purchaseId - Purchase ID to check
	 * @returns Purchase status or null if not found
	 */
	async getPurchaseStatus(token: string, purchaseId: string): Promise<PurchaseStatusResult | null> {
		try {
			const response = await fetch(`${this.authUrl}/api/v1/credits/purchase/${purchaseId}`, {
				method: 'GET',
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				this.logger.warn(`Failed to get purchase status: ${response.status}`);
				return null;
			}

			const result = (await response.json()) as {
				id: string;
				status: 'pending' | 'completed' | 'failed';
				credits: number;
				priceEuroCents: number;
				createdAt: string;
				completedAt?: string;
			};

			return {
				id: result.id,
				status: result.status,
				credits: result.credits,
				priceEuroCents: result.priceEuroCents,
				createdAt: new Date(result.createdAt),
				completedAt: result.completedAt ? new Date(result.completedAt) : undefined,
			};
		} catch (error) {
			this.logger.error('Error getting purchase status:', error);
			return null;
		}
	}

	/**
	 * Format price in euro cents to human-readable format
	 *
	 * @param priceEuroCents - Price in euro cents
	 * @returns Formatted price (e.g., "4,99 €")
	 */
	private formatPrice(priceEuroCents: number): string {
		const euros = priceEuroCents / 100;
		return `${euros.toFixed(2).replace('.', ',')} €`;
	}
}
