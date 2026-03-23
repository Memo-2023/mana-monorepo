import Purchases, { PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';
import { getEntitlementForProductId } from './revenueCatProductIds';
import { tokensApi } from './backendApi';

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
export const TOKEN_AMOUNTS: Record<string, number> = {
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
	for (const [_key, value] of Object.entries(ENTITLEMENTS)) {
		if (value === entitlement) {
			return TOKEN_AMOUNTS[value] || 0;
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
			// Bestehende Käufe synchronisieren
			console.log('Synchronisiere bestehende Käufe...');
			await syncPurchases();
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
 * Synchronisiert bestehende Käufe
 */
const syncPurchases = async (): Promise<void> => {
	// Auf Web-Plattform überspringen
	if (Platform.OS === 'web') {
		return;
	}

	try {
		// Prüfen, ob RevenueCat initialisiert ist
		if (!Purchases.isConfigured) {
			console.warn('RevenueCat ist nicht konfiguriert. Synchronisierung wird übersprungen.');
			return;
		}

		console.log('Rufe Kundeninformationen von RevenueCat ab...');
		const customerInfo = await Purchases.getCustomerInfo();
		console.log('Kundeninformationen erfolgreich abgerufen');

		// Aktive Entitlements loggen
		const entitlements = Object.keys(customerInfo.entitlements.active);
		console.log('Aktive Entitlements:', entitlements);

		// Note: Token balance management is now handled server-side
		// The backend handles purchase verification and token grants

		console.log('Synchronisierung der Käufe abgeschlossen');
	} catch (error) {
		console.error('Fehler beim Synchronisieren der Käufe:', error);
		if (error instanceof Error) {
			console.error('Fehlerdetails:', error.message);
			console.error('Stack:', error.stack);
		}
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

		// Note: Token balance updates should be handled server-side
		// via a webhook or backend verification of the purchase receipt
		// For now, we trust that the backend will sync the balance

		return true;
	} catch (error) {
		console.error('Error purchasing package:', error);
		return false;
	}
}

/**
 * Ruft das aktuelle Token-Guthaben des Benutzers ab (via backend API)
 */
export const getCurrentTokenBalance = async (): Promise<number | null> => {
	try {
		const balance = await tokensApi.getBalance();
		return balance;
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
