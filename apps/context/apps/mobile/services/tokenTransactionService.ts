import { tokensApi, type TokenTransaction, type TokenUsageStats } from './backendApi';

// Re-export types for backward compatibility
export type { TokenTransaction, TokenUsageStats };

/**
 * Ruft das aktuelle Token-Guthaben des authentifizierten Benutzers ab.
 * The userId parameter is kept for backward compatibility but is ignored -
 * the backend determines the user from the JWT token.
 */
export const getCurrentTokenBalance = async (_userId?: string): Promise<number> => {
	return tokensApi.getBalance();
};

/**
 * Prüft, ob der Benutzer genügend Tokens für eine Anfrage hat
 */
export const hasEnoughTokens = async (
	_userId: string,
	requiredTokens: number
): Promise<boolean> => {
	const balance = await getCurrentTokenBalance();
	return balance >= requiredTokens;
};

/**
 * Ruft die Token-Nutzungsstatistiken ab
 */
export const getTokenUsageStats = async (
	_userId: string,
	timeframe: 'day' | 'week' | 'month' | 'year' = 'month'
): Promise<TokenUsageStats> => {
	return tokensApi.getStats(timeframe);
};

/**
 * Ruft die Token-Transaktionen ab
 */
export const getTokenTransactions = async (
	_userId: string,
	limit: number = 10,
	offset: number = 0
): Promise<TokenTransaction[]> => {
	return tokensApi.getTransactions(limit, offset);
};

/**
 * Die folgenden Funktionen werden nicht mehr benötigt, da das Backend
 * Token-Operationen (Abzug, Hinzufügen, Reset) serverseitig handhabt.
 * Sie werden nur als No-Op Stubs beibehalten für den Fall, dass sie
 * noch irgendwo referenziert werden.
 */

export const logTokenUsage = async (
	_userId: string,
	_model: string,
	_prompt: string,
	_completion: string,
	_documentId?: string
): Promise<boolean> => {
	// Token usage is now logged server-side during AI generation
	console.warn('logTokenUsage is a no-op - token usage is tracked server-side');
	return true;
};

export const addTokens = async (
	_userId: string,
	_amount: number,
	_source: string,
	_packageName?: string,
	_entitlement?: string
): Promise<boolean> => {
	// Token additions are handled server-side
	console.warn('addTokens is a no-op - token operations are handled server-side');
	return true;
};

export const resetMonthlyTokens = async (_userId: string): Promise<boolean> => {
	console.warn('resetMonthlyTokens is a no-op - handled server-side');
	return false;
};

export const checkAndResetMonthlyTokens = async (_userId: string): Promise<boolean> => {
	console.warn('checkAndResetMonthlyTokens is a no-op - handled server-side');
	return false;
};
