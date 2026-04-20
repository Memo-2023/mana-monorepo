/**
 * Credit client for Hono backends.
 *
 * Drop-in replacement for @mana-core/nestjs-integration CreditClientService.
 * Calls mana-credits service to validate/consume/refund credits.
 */

export interface CreditBalance {
	balance: number;
	totalEarned: number;
	totalSpent: number;
}

export interface CreditValidationResult {
	hasCredits: boolean;
	availableCredits: number;
	requiredCredits?: number;
}

const CREDITS_URL = () =>
	process.env.MANA_CREDITS_URL || process.env.MANA_AUTH_URL || 'http://localhost:3061';
const SERVICE_KEY = () => process.env.MANA_SERVICE_KEY || '';
const APP_ID = () => process.env.APP_ID || 'unknown';

const DEFAULT_BALANCE: CreditBalance = { balance: 1000, totalEarned: 0, totalSpent: 0 };

async function callCredits<T>(path: string, options: RequestInit = {}): Promise<T | null> {
	const key = SERVICE_KEY();
	if (!key) {
		console.warn('[credits] Service key not configured');
		return null;
	}

	try {
		const res = await fetch(`${CREDITS_URL()}${path}`, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				'X-Service-Key': key,
				'X-App-Id': APP_ID(),
				...options.headers,
			},
		});
		if (!res.ok) return null;
		return (await res.json()) as T;
	} catch (error) {
		console.error('[credits] Request failed:', error);
		return null;
	}
}

/**
 * Get user's credit balance.
 */
export async function getBalance(userId: string): Promise<CreditBalance> {
	const result = await callCredits<CreditBalance>(`/api/v1/internal/credits/balance/${userId}`);
	return result || DEFAULT_BALANCE;
}

/**
 * Validate that user has enough credits for an operation.
 */
export async function validateCredits(
	userId: string,
	_operation: string,
	amount: number
): Promise<CreditValidationResult> {
	try {
		const balance = await getBalance(userId);
		return {
			hasCredits: balance.balance >= amount,
			availableCredits: balance.balance,
			requiredCredits: amount,
		};
	} catch {
		return { hasCredits: true, availableCredits: 0, requiredCredits: amount };
	}
}

/**
 * Consume credits after a successful operation.
 */
export async function consumeCredits(
	userId: string,
	operation: string,
	amount: number,
	description: string,
	metadata?: Record<string, unknown>
): Promise<boolean> {
	const result = await callCredits('/api/v1/internal/credits/use', {
		method: 'POST',
		body: JSON.stringify({
			userId,
			amount,
			appId: APP_ID(),
			description,
			metadata: { operation, ...metadata },
		}),
	});
	return !!result;
}

/**
 * Refund credits after a failed operation.
 */
export async function refundCredits(
	userId: string,
	amount: number,
	description: string,
	metadata?: Record<string, unknown>
): Promise<boolean> {
	const result = await callCredits('/api/v1/internal/credits/refund', {
		method: 'POST',
		body: JSON.stringify({
			userId,
			amount,
			appId: APP_ID(),
			description,
			metadata,
		}),
	});
	return !!result;
}
