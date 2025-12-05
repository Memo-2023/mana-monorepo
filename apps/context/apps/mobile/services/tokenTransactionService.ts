import { supabase } from '../utils/supabase';
import { estimateTokens, calculateCost } from './tokenCountingService';

// Typdefinitionen
export type TokenTransaction = {
	id: string;
	user_id: string;
	amount: number;
	transaction_type: string;
	model_used?: string;
	prompt_tokens?: number;
	completion_tokens?: number;
	total_tokens?: number;
	cost_usd?: number;
	document_id?: string;
	created_at: string;
};

export type TokenUsageStats = {
	totalUsed: number;
	byModel: Record<string, number>;
	byDate: Record<string, number>;
};

/**
 * Protokolliert die Token-Nutzung für eine KI-Anfrage
 */
export const logTokenUsage = async (
	userId: string,
	model: string,
	prompt: string,
	completion: string,
	documentId?: string
): Promise<boolean> => {
	try {
		// Schätze die Token-Anzahl
		const promptTokens = estimateTokens(prompt);
		const completionTokens = estimateTokens(completion);

		// Berechne die Kosten
		const { appTokens, costUsd } = await calculateCost(model, promptTokens, completionTokens);

		// Prüfe, ob die übergebene ID ein gültiges Dokument ist
		let validDocumentId = null;
		if (documentId) {
			// Prüfe, ob das Dokument existiert
			const { data: docExists } = await supabase
				.from('documents')
				.select('id')
				.eq('id', documentId)
				.maybeSingle();

			if (docExists) {
				validDocumentId = documentId;
			} else {
				console.log(
					'Dokument-ID existiert nicht in der documents-Tabelle, setze auf null:',
					documentId
				);
			}
		}

		// Verwende die SQL-Funktion use_tokens, um Tokens abzuziehen und die Transaktion zu protokollieren
		const { data, error } = await supabase.rpc('use_tokens', {
			p_user_id: userId,
			p_amount: appTokens,
			p_model_used: model,
			p_document_id: validDocumentId, // Nur gültige Dokument-IDs verwenden
			p_prompt_tokens: promptTokens,
			p_completion_tokens: completionTokens,
			p_cost_usd: costUsd,
		});

		if (error) {
			console.error('Fehler beim Abziehen von Tokens:', error);
			return false;
		}

		// Die Funktion gibt true zurück, wenn genügend Tokens vorhanden waren
		return data === true;
	} catch (error) {
		console.error('Fehler bei der Token-Nutzungsprotokollierung:', error);
		return false;
	}
};

/**
 * Fügt Tokens zum Guthaben eines Benutzers hinzu
 */
export const addTokens = async (
	userId: string,
	amount: number,
	source: string,
	packageName?: string,
	entitlement?: string
): Promise<boolean> => {
	try {
		// Verwende die SQL-Funktion add_tokens, um Tokens hinzuzufügen und die Transaktion zu protokollieren
		const { data, error } = await supabase.rpc('add_tokens', {
			p_user_id: userId,
			p_amount: amount,
			p_transaction_type: source, // z.B. 'purchase', 'monthly_reset', 'admin_grant'
			p_package_name: packageName || null,
			p_entitlement: entitlement || null,
		});

		if (error) {
			console.error('Fehler beim Hinzufügen von Tokens:', error);
			return false;
		}

		return data === true;
	} catch (error) {
		console.error('Fehler beim Hinzufügen von Tokens:', error);
		return false;
	}
};

/**
 * Setzt das monatliche Token-Kontingent eines Benutzers zurück
 *
 * Hinweis: Diese Funktion wird normalerweise nicht manuell aufgerufen,
 * da der monatliche Reset automatisch durch einen Cron-Job in der Datenbank erfolgt.
 * Sie kann jedoch für Tests oder manuelle Resets verwendet werden.
 */
export const resetMonthlyTokens = async (userId: string): Promise<boolean> => {
	try {
		// Hole die Benutzerinformationen
		const { data: userData } = await supabase
			.from('users')
			.select('monthly_free_tokens')
			.eq('id', userId)
			.single();

		if (!userData) {
			console.error('Benutzer nicht gefunden');
			return false;
		}

		// Verwende die add_tokens-Funktion mit dem Transaktionstyp 'monthly_reset'
		return await addTokens(userId, userData.monthly_free_tokens, 'monthly_reset');
	} catch (error) {
		console.error('Fehler beim Zurücksetzen des monatlichen Token-Kontingents:', error);
		return false;
	}
};

/**
 * Prüft, ob das monatliche Token-Kontingent eines Benutzers zurückgesetzt werden sollte
 */
export const checkAndResetMonthlyTokens = async (userId: string): Promise<boolean> => {
	try {
		// Hole die Benutzerinformationen
		const { data: userData } = await supabase
			.from('users')
			.select('last_token_reset')
			.eq('id', userId)
			.single();

		if (!userData) {
			console.error('Benutzer nicht gefunden');
			return false;
		}

		const lastReset = new Date(userData.last_token_reset);
		const now = new Date();

		// Prüfe, ob der letzte Reset mehr als einen Monat zurückliegt
		const monthDiff =
			(now.getFullYear() - lastReset.getFullYear()) * 12 + now.getMonth() - lastReset.getMonth();

		if (monthDiff >= 1) {
			return resetMonthlyTokens(userId);
		}

		return false;
	} catch (error) {
		console.error('Fehler beim Prüfen des monatlichen Token-Kontingents:', error);
		return false;
	}
};

/**
 * Ruft das aktuelle Token-Guthaben eines Benutzers ab
 */
export const getCurrentTokenBalance = async (userId: string): Promise<number> => {
	try {
		// Prüfe, ob das monatliche Kontingent zurückgesetzt werden sollte
		await checkAndResetMonthlyTokens(userId);

		// Hole das aktuelle Token-Guthaben
		const { data: userData } = await supabase
			.from('users')
			.select('token_balance')
			.eq('id', userId)
			.single();

		if (!userData) {
			console.error('Benutzer nicht gefunden');
			return 0;
		}

		console.log('Token-Guthaben:', userData.token_balance);
		return userData.token_balance;
	} catch (error) {
		console.error('Fehler beim Abrufen des Token-Guthabens:', error);
		return 0;
	}
};

/**
 * Prüft, ob ein Benutzer genügend Tokens für eine Anfrage hat
 */
export const hasEnoughTokens = async (userId: string, requiredTokens: number): Promise<boolean> => {
	const balance = await getCurrentTokenBalance(userId);
	return balance >= requiredTokens;
};

/**
 * Ruft die Token-Nutzungsstatistiken eines Benutzers ab
 */
export const getTokenUsageStats = async (
	userId: string,
	timeframe: 'day' | 'week' | 'month' | 'year' = 'month'
): Promise<TokenUsageStats> => {
	try {
		// Bestimme die Anzahl der Tage basierend auf dem Zeitrahmen
		let days = 30; // Standard: 1 Monat

		switch (timeframe) {
			case 'day':
				days = 1;
				break;
			case 'week':
				days = 7;
				break;
			case 'month':
				days = 30;
				break;
			case 'year':
				days = 365;
				break;
		}

		// Verwende die SQL-Funktion get_token_usage_stats
		const { data: modelStats, error } = await supabase.rpc('get_token_usage_stats', {
			p_user_id: userId,
			p_days: days,
		});

		if (error) {
			console.error('Fehler beim Abrufen der Token-Nutzungsstatistiken:', error);
			return {
				totalUsed: 0,
				byModel: {},
				byDate: {},
			};
		}

		// Hole zusätzlich die Daten nach Datum für das Diagramm
		const { data: transactions } = await supabase
			.from('token_transactions')
			.select('created_at, amount')
			.eq('user_id', userId)
			.eq('transaction_type', 'usage')
			.gte('created_at', new Date(new Date().setDate(new Date().getDate() - days)).toISOString())
			.order('created_at', { ascending: true });

		// Berechne die Statistiken
		const stats: TokenUsageStats = {
			totalUsed: 0,
			byModel: {},
			byDate: {},
		};

		// Verarbeite die Modellstatistiken
		if (modelStats && modelStats.length > 0) {
			modelStats.forEach((stat: any) => {
				stats.totalUsed += stat.total_app_tokens || 0;

				if (stat.model_name) {
					stats.byModel[stat.model_name] = stat.total_app_tokens || 0;
				}
			});
		}

		// Verarbeite die Datumsstatistiken
		if (transactions && transactions.length > 0) {
			transactions.forEach((transaction: any) => {
				const date = new Date(transaction.created_at).toISOString().split('T')[0];
				if (!stats.byDate[date]) {
					stats.byDate[date] = 0;
				}
				stats.byDate[date] += Math.abs(transaction.amount);
			});
		}

		return stats;
	} catch (error) {
		console.error('Fehler beim Abrufen der Token-Nutzungsstatistiken:', error);
		return {
			totalUsed: 0,
			byModel: {},
			byDate: {},
		};
	}
};

/**
 * Ruft die Token-Transaktionen eines Benutzers ab
 */
export const getTokenTransactions = async (
	userId: string,
	limit: number = 10,
	offset: number = 0
): Promise<TokenTransaction[]> => {
	try {
		const { data: transactions } = await supabase
			.from('token_transactions')
			.select('*')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.range(offset, offset + limit - 1);

		return transactions || [];
	} catch (error) {
		console.error('Fehler beim Abrufen der Token-Transaktionen:', error);
		return [];
	}
};
