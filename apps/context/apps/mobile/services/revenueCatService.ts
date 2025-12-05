import Purchases, { PurchasesPackage, CustomerInfo, PurchasesError } from 'react-native-purchases';
import { Platform } from 'react-native';
import { supabase } from '../utils/supabase';
import { getEntitlementForProductId } from './revenueCatProductIds';

// Direkt im Code setzen für Testzwecke
const REVENUECAT_API_KEY_IOS = 'appl_kRiosNzSxUFTkqPhQEFMVyFWtPM';
const REVENUECAT_API_KEY_ANDROID = 'goog_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

// Entitlement-IDs für verschiedene Token-Pakete
export const ENTITLEMENTS = {
	// Abonnements
	MINI_SUB: 'mini_subscription',
	PLUS_SUB: 'plus_subscription',
	PRO_SUB: 'pro_subscription',

	// Einmalkäufe
	SMALL_TOKENS: 'small_tokens_package',
	MEDIUM_TOKENS: 'medium_tokens_package',
	LARGE_TOKENS: 'large_tokens_package',
};

// Token-Mengen für jedes Paket (in Millionen Credits)
export const TOKEN_AMOUNTS = {
	// Abonnements (monatlich)
	[ENTITLEMENTS.MINI_SUB]: 5000000, // 5 Mio Credits
	[ENTITLEMENTS.PLUS_SUB]: 10000000, // 10 Mio Credits
	[ENTITLEMENTS.PRO_SUB]: 22000000, // 22 Mio Credits

	// Einmalkäufe
	[ENTITLEMENTS.SMALL_TOKENS]: 3000000, // 3 Mio Credits
	[ENTITLEMENTS.MEDIUM_TOKENS]: 7000000, // 7 Mio Credits
	[ENTITLEMENTS.LARGE_TOKENS]: 15000000, // 15 Mio Credits
};

/**
 * Gibt die Anzahl der Credits für ein bestimmtes Paket zurück
 */
export function getTokenAmountForPackage(pkg: PurchasesPackage): number {
	const productId = pkg.product.identifier;
	const entitlement = getEntitlementForProductId(productId);

	if (!entitlement) return 0;

	// Entitlement zu TOKEN_AMOUNTS zuordnen
	for (const [key, value] of Object.entries(ENTITLEMENTS)) {
		if (value === entitlement) {
			return TOKEN_AMOUNTS[value];
		}
	}

	return 0;
}

/**
 * Initialisiert RevenueCat mit dem entsprechenden API-Key
 * @param userId Die ID des aktuellen Benutzers
 */
export const initializeRevenueCat = async (userId: string): Promise<void> => {
	// RevenueCat nur auf mobilen Plattformen initialisieren
	if (Platform.OS === 'web') {
		console.log('RevenueCat wird auf der Web-Plattform übersprungen');
		return;
	}

	try {
		const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;

		if (!apiKey) {
			console.error('RevenueCat API Key nicht gefunden für', Platform.OS);
			return;
		}

		console.log('Verwende RevenueCat API Key:', apiKey.substring(0, 10) + '...');

		// Maximale Debug-Informationen für Fehlersuche
		Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);

		// RevenueCat konfigurieren
		console.log('Konfiguriere RevenueCat für Benutzer:', userId);
		await Purchases.configure({
			apiKey,
			appUserID: userId,
		});

		console.log('RevenueCat erfolgreich initialisiert für Benutzer', userId);

		try {
			// Aktuellen Benutzer in der Datenbank mit RevenueCat ID aktualisieren
			await updateUserRevenueCatId(userId);
			console.log('RevenueCat ID in Datenbank aktualisiert');
		} catch (updateError) {
			console.error('Fehler beim Aktualisieren der RevenueCat ID:', updateError);
			// Fortfahren trotz Fehler
		}

		try {
			// Bestehende Käufe synchronisieren
			console.log('Synchronisiere bestehende Käufe...');
			await syncPurchases(userId);
			console.log('Käufe erfolgreich synchronisiert');
		} catch (syncError) {
			console.error('Fehler beim Synchronisieren der Käufe:', syncError);
			// Fortfahren trotz Fehler
		}
	} catch (error) {
		console.error('Fehler bei der Initialisierung von RevenueCat:', error);
		if (error instanceof Error) {
			console.error('Fehlerdetails:', error.message);
			console.error('Stack:', error.stack);
		}
	}
};

/**
 * Aktualisiert die RevenueCat ID des Benutzers in der Datenbank
 */
const updateUserRevenueCatId = async (userId: string): Promise<void> => {
	try {
		const { error } = await supabase
			.from('users')
			.update({ revenue_cat_id: userId })
			.eq('id', userId);

		if (error) {
			console.error('Fehler beim Aktualisieren der RevenueCat ID:', error);
		}
	} catch (error) {
		console.error('Fehler beim Aktualisieren der RevenueCat ID:', error);
	}
};

/**
 * Synchronisiert bestehende Käufe mit der Datenbank
 */
const syncPurchases = async (userId: string): Promise<void> => {
	// Auf Web-Plattform überspringen
	if (Platform.OS === 'web') {
		return;
	}

	try {
		console.log('Starte Synchronisierung der Käufe für Benutzer:', userId);

		// Prüfen, ob RevenueCat initialisiert ist
		if (!Purchases.isConfigured) {
			console.warn('RevenueCat ist nicht konfiguriert. Synchronisierung wird übersprungen.');
			return;
		}

		console.log('Rufe Kundeninformationen von RevenueCat ab...');
		const customerInfo = await Purchases.getCustomerInfo();
		console.log('Kundeninformationen erfolgreich abgerufen');

		// Aktives Abonnement in der Datenbank aktualisieren
		const entitlements = Object.keys(customerInfo.entitlements.active);
		console.log('Aktive Entitlements:', entitlements);

		if (entitlements.length > 0) {
			const currentEntitlement = entitlements[0];
			console.log('Aktuelles Entitlement:', currentEntitlement);

			// Datenbank aktualisieren
			console.log('Aktualisiere Entitlement in der Datenbank...');
			const { error } = await supabase
				.from('users')
				.update({ current_entitlement: currentEntitlement })
				.eq('id', userId);

			if (error) {
				console.error('Fehler beim Aktualisieren des Entitlements in der Datenbank:', error);
			} else {
				console.log('Entitlement erfolgreich in der Datenbank aktualisiert');
			}

			// Wenn ein aktives Abonnement vorhanden ist, Token-Guthaben aktualisieren
			if (TOKEN_AMOUNTS[currentEntitlement]) {
				console.log('Füge Tokens zum Benutzerguthaben hinzu:', TOKEN_AMOUNTS[currentEntitlement]);
				await addTokensToUser(userId, TOKEN_AMOUNTS[currentEntitlement], 'purchase');
				console.log('Tokens erfolgreich hinzugefügt');
			} else {
				console.log('Kein Token-Betrag für Entitlement gefunden:', currentEntitlement);
			}
		} else {
			console.log('Keine aktiven Entitlements gefunden');
		}

		console.log('Synchronisierung der Käufe abgeschlossen');
	} catch (error) {
		console.error('Fehler beim Synchronisieren der Käufe:', error);
		if (error instanceof Error) {
			console.error('Fehlerdetails:', error.message);
			console.error('Stack:', error.stack);
		}
		// Fehler werfen, damit er in der aufrufenden Funktion behandelt werden kann
		throw error;
	}
};

/**
 * Ruft alle verfügbaren Angebote ab
 */
export const getOfferings = async (): Promise<PurchasesPackage[] | null> => {
	// Auf Web-Plattform null zurückgeben
	if (Platform.OS === 'web') {
		return null;
	}

	try {
		const offerings = await Purchases.getOfferings();

		if (offerings.current && offerings.current.availablePackages.length > 0) {
			return offerings.current.availablePackages;
		}

		return null;
	} catch (error) {
		console.error('Fehler beim Abrufen der Angebote:', error);
		return null;
	}
};

/**
 * Kauft ein Token-Paket oder Abonnement
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
	// Auf Web-Plattform immer false zurückgeben
	if (Platform.OS === 'web') {
		console.warn('Käufe sind auf der Web-Plattform nicht verfügbar');
		return false;
	}

	try {
		const { customerInfo } = await Purchases.purchasePackage(pkg);
		console.log('Purchase successful:', customerInfo);

		// Aktualisiere das Token-Guthaben des Benutzers
		const tokenAmount = getTokenAmountForPackage(pkg);
		if (tokenAmount > 0) {
			const { data: user } = await supabase.auth.getUser();
			if (user?.user?.id) {
				// Token-Guthaben in der Datenbank aktualisieren
				const { error } = await supabase.rpc('add_tokens', {
					p_user_id: user.user.id,
					p_amount: tokenAmount,
				});

				if (error) {
					console.error('Error updating token balance:', error);
					return false;
				}

				// Bestimme den Transaktionstyp basierend auf dem Pakettyp
				const transactionType =
					pkg.packageType === 'MONTHLY' || pkg.packageType === 'ANNUAL'
						? 'subscription'
						: 'purchase';

				// Token-Transaktion protokollieren
				const { error: transactionError } = await supabase.from('token_transactions').insert({
					user_id: user.user.id,
					amount: tokenAmount,
					transaction_type: transactionType,
					metadata: {
						package_id: pkg.product.identifier,
						package_type: pkg.packageType,
					},
				});

				if (transactionError) {
					console.error('Error logging token transaction:', transactionError);
				}
			}
		}

		return true;
	} catch (error) {
		console.error('Error purchasing package:', error);
		return false;
	}
}

/**
 * Fügt Tokens zum Guthaben des Benutzers hinzu und protokolliert die Transaktion
 */
const addTokensToUser = async (
	userId: string,
	amount: number,
	source: string
): Promise<boolean> => {
	try {
		// Aktuelles Token-Guthaben abrufen
		const { data: userData, error: userError } = await supabase
			.from('users')
			.select('token_balance')
			.eq('id', userId)
			.single();

		if (userError || !userData) {
			console.error('Fehler beim Abrufen des Token-Guthabens:', userError);
			return false;
		}

		const currentBalance = userData.token_balance || 0;
		const newBalance = currentBalance + amount;

		// Token-Guthaben aktualisieren
		const { error: updateError } = await supabase
			.from('users')
			.update({ token_balance: newBalance })
			.eq('id', userId);

		if (updateError) {
			console.error('Fehler beim Aktualisieren des Token-Guthabens:', updateError);
			return false;
		}

		// Transaktion protokollieren
		const { error: transactionError } = await supabase.from('token_transactions').insert({
			user_id: userId,
			amount,
			transaction_type: source,
		});

		if (transactionError) {
			console.error('Fehler beim Protokollieren der Transaktion:', transactionError);
			return false;
		}

		return true;
	} catch (error) {
		console.error('Fehler beim Hinzufügen von Tokens:', error);
		return false;
	}
};

/**
 * Ruft das aktuelle Token-Guthaben des Benutzers ab
 */
export const getCurrentTokenBalance = async (): Promise<number | null> => {
	try {
		// Benutzer-ID aus der aktuellen Session abrufen
		const { data: user } = await supabase.auth.getUser();
		if (!user?.user?.id) return null;

		const { data, error } = await supabase
			.from('users')
			.select('token_balance')
			.eq('id', user.user.id)
			.single();

		if (error || !data) {
			console.error('Fehler beim Abrufen des Token-Guthabens:', error);
			return null;
		}

		return data.token_balance || 0;
	} catch (error) {
		console.error('Fehler beim Abrufen des Token-Guthabens:', error);
		return null;
	}
};

/**
 * Prüft, ob ein Benutzer genügend Tokens für eine Anfrage hat
 */
export const hasEnoughTokens = async (requiredTokens: number): Promise<boolean> => {
	const currentBalance = await getCurrentTokenBalance();
	return currentBalance !== null && currentBalance >= requiredTokens;
};

/**
 * Ruft die Kundeninformationen von RevenueCat ab
 */
export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
	// Auf Web-Plattform null zurückgeben
	if (Platform.OS === 'web') {
		return null;
	}

	try {
		return await Purchases.getCustomerInfo();
	} catch (error) {
		console.error('Fehler beim Abrufen der Kundeninformationen:', error);
		return null;
	}
};

/**
 * Setzt die Benutzer-ID für RevenueCat
 * Nützlich, wenn sich der Benutzer anmeldet oder abmeldet
 */
export const setRevenueCatUserId = async (userId: string): Promise<void> => {
	// Auf Web-Plattform überspringen
	if (Platform.OS === 'web') {
		return;
	}

	try {
		await Purchases.logIn(userId);
	} catch (error) {
		console.error('Fehler beim Setzen der RevenueCat Benutzer-ID:', error);
	}
};

/**
 * Meldet den Benutzer von RevenueCat ab
 */
export const logOutRevenueCat = async (): Promise<void> => {
	// Auf Web-Plattform überspringen
	if (Platform.OS === 'web') {
		return;
	}

	try {
		await Purchases.logOut();
	} catch (error) {
		console.error('Fehler beim Abmelden von RevenueCat:', error);
	}
};
