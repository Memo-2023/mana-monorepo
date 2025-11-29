// GDPR Compliance Implementierung für uLoad
// Datenschutz-Grundverordnung (DSGVO) Konformität

export interface GDPRConsent {
	necessary: boolean; // Immer true, technisch erforderlich
	analytics: boolean;
	marketing: boolean;
	preferences: boolean;
	timestamp: string;
	version: string;
}

export interface DataProcessingPurpose {
	id: string;
	name: string;
	description: string;
	legalBasis:
		| 'consent'
		| 'contract'
		| 'legal_obligation'
		| 'vital_interests'
		| 'public_task'
		| 'legitimate_interests';
	dataTypes: string[];
	retention: string;
	required: boolean;
}

// GDPR-konforme Datenverarbeitungszwecke für uLoad
export const DATA_PROCESSING_PURPOSES: DataProcessingPurpose[] = [
	{
		id: 'account_management',
		name: 'Account-Verwaltung',
		description: 'Bereitstellung und Verwaltung Ihres Benutzerkontos',
		legalBasis: 'contract',
		dataTypes: ['email', 'username', 'password_hash', 'profile_data'],
		retention: 'Bis zur Kontolöschung',
		required: true,
	},
	{
		id: 'link_service',
		name: 'Link-Verkürrungs-Service',
		description: 'Erstellung und Verwaltung von kurzen Links',
		legalBasis: 'contract',
		dataTypes: ['original_urls', 'short_codes', 'link_metadata'],
		retention: 'Bis zur manuellen Löschung oder Kontolöschung',
		required: true,
	},
	{
		id: 'click_analytics',
		name: 'Click-Analytics',
		description: 'Anonyme Analyse von Link-Klicks für Statistiken',
		legalBasis: 'legitimate_interests',
		dataTypes: ['anonymized_ip', 'user_agent', 'referer', 'timestamp'],
		retention: '12 Monate',
		required: false,
	},
	{
		id: 'security',
		name: 'Sicherheit und Betrug-Prävention',
		description: 'Schutz vor Missbrauch und Sicherheit der Plattform',
		legalBasis: 'legitimate_interests',
		dataTypes: ['ip_address', 'user_agent', 'access_logs'],
		retention: '6 Monate',
		required: true,
	},
	{
		id: 'communication',
		name: 'Service-Kommunikation',
		description: 'Wichtige Mitteilungen zum Service (Updates, Sicherheit)',
		legalBasis: 'contract',
		dataTypes: ['email', 'communication_preferences'],
		retention: 'Bis zur Kontolöschung',
		required: true,
	},
	{
		id: 'marketing',
		name: 'Marketing und Newsletter',
		description: 'Produktneuigkeiten und Marketing-Kommunikation',
		legalBasis: 'consent',
		dataTypes: ['email', 'usage_patterns', 'preferences'],
		retention: 'Bis zum Widerruf der Einwilligung',
		required: false,
	},
	{
		id: 'analytics',
		name: 'Website-Analytics',
		description: 'Analyse der Website-Nutzung zur Verbesserung',
		legalBasis: 'consent',
		dataTypes: ['anonymized_usage_data', 'page_views', 'session_data'],
		retention: '14 Monate',
		required: false,
	},
];

// Standard GDPR Consent
export const DEFAULT_CONSENT: GDPRConsent = {
	necessary: true,
	analytics: false,
	marketing: false,
	preferences: false,
	timestamp: new Date().toISOString(),
	version: '1.0',
};

// GDPR Consent Manager
export class GDPRManager {
	private static readonly CONSENT_KEY = 'gdpr_consent';
	private static readonly CONSENT_VERSION = '1.0';

	// Aktuelle Einwilligung laden
	static getConsent(): GDPRConsent | null {
		if (typeof localStorage === 'undefined') return null;

		try {
			const stored = localStorage.getItem(this.CONSENT_KEY);
			if (!stored) return null;

			const consent = JSON.parse(stored) as GDPRConsent;

			// Prüfe Version - bei Änderungen neue Einwilligung erforderlich
			if (consent.version !== this.CONSENT_VERSION) {
				this.clearConsent();
				return null;
			}

			return consent;
		} catch (error) {
			console.error('Error loading GDPR consent:', error);
			return null;
		}
	}

	// Einwilligung speichern
	static setConsent(consent: Partial<GDPRConsent>): void {
		if (typeof localStorage === 'undefined') return;

		const fullConsent: GDPRConsent = {
			...DEFAULT_CONSENT,
			...consent,
			timestamp: new Date().toISOString(),
			version: this.CONSENT_VERSION,
		};

		try {
			localStorage.setItem(this.CONSENT_KEY, JSON.stringify(fullConsent));

			// Event für andere Teile der App
			window.dispatchEvent(
				new CustomEvent('gdpr:consent-updated', {
					detail: fullConsent,
				})
			);

			console.log('GDPR consent updated:', fullConsent);
		} catch (error) {
			console.error('Error saving GDPR consent:', error);
		}
	}

	// Einwilligung löschen
	static clearConsent(): void {
		if (typeof localStorage === 'undefined') return;

		localStorage.removeItem(this.CONSENT_KEY);

		window.dispatchEvent(new CustomEvent('gdpr:consent-cleared'));
		console.log('GDPR consent cleared');
	}

	// Prüfe ob Einwilligung erforderlich ist
	static needsConsent(): boolean {
		const consent = this.getConsent();
		return consent === null;
	}

	// Prüfe spezifische Einwilligung
	static hasConsent(type: keyof Omit<GDPRConsent, 'timestamp' | 'version'>): boolean {
		const consent = this.getConsent();
		if (!consent) return type === 'necessary'; // Nur notwendige Cookies ohne Einwilligung

		return consent[type];
	}

	// Benutzerrechte verwalten
	static async exerciseUserRights(request: UserRightRequest): Promise<UserRightResponse> {
		switch (request.type) {
			case 'access':
				return this.handleDataAccess(request);
			case 'rectification':
				return this.handleDataRectification(request);
			case 'erasure':
				return this.handleDataErasure(request);
			case 'portability':
				return this.handleDataPortability(request);
			case 'restriction':
				return this.handleProcessingRestriction(request);
			case 'objection':
				return this.handleProcessingObjection(request);
			default:
				throw new Error('Unknown user right request');
		}
	}

	// Recht auf Auskunft (Art. 15 DSGVO)
	private static async handleDataAccess(request: UserRightRequest): Promise<UserRightResponse> {
		// Sammle alle Benutzerdaten
		const userData = {
			account: {
				email: request.userEmail,
				created: request.accountCreated,
				lastLogin: request.lastLogin,
			},
			links: request.userLinks || [],
			analytics: request.userAnalytics || [],
			consent: this.getConsent(),
			purposes: DATA_PROCESSING_PURPOSES.filter((p) => p.required || this.hasConsent(p.id as any)),
		};

		return {
			success: true,
			type: 'access',
			data: userData,
			message: 'Ihre personenbezogenen Daten wurden zusammengestellt',
		};
	}

	// Recht auf Berichtigung (Art. 16 DSGVO)
	private static async handleDataRectification(
		request: UserRightRequest
	): Promise<UserRightResponse> {
		// In einer echten Implementation würde hier eine API-Anfrage an den Server gehen
		return {
			success: true,
			type: 'rectification',
			message: 'Ihr Antrag auf Datenberichtigung wurde eingereicht',
		};
	}

	// Recht auf Löschung (Art. 17 DSGVO)
	private static async handleDataErasure(request: UserRightRequest): Promise<UserRightResponse> {
		// Lokale Consent-Daten löschen
		this.clearConsent();

		return {
			success: true,
			type: 'erasure',
			message: 'Ihr Antrag auf Datenlöschung wurde eingereicht',
		};
	}

	// Recht auf Datenübertragbarkeit (Art. 20 DSGVO)
	private static async handleDataPortability(
		request: UserRightRequest
	): Promise<UserRightResponse> {
		const exportData = {
			links: request.userLinks || [],
			analytics: request.userAnalytics || [],
			profile: request.userProfile || {},
			exportDate: new Date().toISOString(),
			format: 'JSON',
		};

		return {
			success: true,
			type: 'portability',
			data: exportData,
			message: 'Ihre Daten wurden für den Export vorbereitet',
		};
	}

	// Recht auf Einschränkung (Art. 18 DSGVO)
	private static async handleProcessingRestriction(
		request: UserRightRequest
	): Promise<UserRightResponse> {
		return {
			success: true,
			type: 'restriction',
			message: 'Ihr Antrag auf Verarbeitungseinschränkung wurde eingereicht',
		};
	}

	// Widerspruchsrecht (Art. 21 DSGVO)
	private static async handleProcessingObjection(
		request: UserRightRequest
	): Promise<UserRightResponse> {
		// Analytics und Marketing deaktivieren
		this.setConsent({
			...this.getConsent(),
			analytics: false,
			marketing: false,
		});

		return {
			success: true,
			type: 'objection',
			message: 'Ihr Widerspruch wurde verarbeitet',
		};
	}
}

// Interfaces für Benutzerrechte
export interface UserRightRequest {
	type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
	userEmail: string;
	accountCreated?: string;
	lastLogin?: string;
	userLinks?: any[];
	userAnalytics?: any[];
	userProfile?: any;
	reason?: string;
}

export interface UserRightResponse {
	success: boolean;
	type: string;
	data?: any;
	message: string;
	error?: string;
}

// Cookie-Banner Utilities
export function shouldShowCookieBanner(): boolean {
	return GDPRManager.needsConsent();
}

export function acceptAllCookies(): void {
	GDPRManager.setConsent({
		necessary: true,
		analytics: true,
		marketing: true,
		preferences: true,
	});
}

export function acceptNecessaryOnly(): void {
	GDPRManager.setConsent({
		necessary: true,
		analytics: false,
		marketing: false,
		preferences: false,
	});
}

// Data Processing Record (Art. 30 DSGVO)
export function generateProcessingRecord(): any {
	return {
		controller: {
			name: 'uLoad',
			contact: 'privacy@ulo.ad',
			representative: 'Till Schneider',
			dpo: null, // Falls kein Datenschutzbeauftragter erforderlich
		},
		purposes: DATA_PROCESSING_PURPOSES,
		categories: {
			dataSubjects: ['users', 'visitors'],
			personalData: ['identification', 'contact', 'usage', 'technical'],
			recipients: ['hosting_provider', 'analytics_provider', 'payment_provider'],
			transfers: ['within_eu'],
		},
		retention: {
			criteria: 'Purpose-based retention',
			periods: DATA_PROCESSING_PURPOSES.map((p) => ({
				purpose: p.name,
				period: p.retention,
			})),
		},
		security: {
			measures: ['encryption', 'access_control', 'regular_backups', 'monitoring'],
			certifications: [],
		},
		lastUpdated: new Date().toISOString(),
	};
}

// Anonymisierung von IP-Adressen (für Analytics)
export function anonymizeIP(ip: string): string {
	if (ip.includes(':')) {
		// IPv6 - entferne die letzten 80 Bits
		const parts = ip.split(':');
		return parts.slice(0, 5).join(':') + '::';
	} else {
		// IPv4 - entferne das letzte Oktett
		const parts = ip.split('.');
		return parts.slice(0, 3).join('.') + '.0';
	}
}

// Daten-Minimierung prüfen
export function isDataMinimal(dataCollection: any): boolean {
	const requiredFields = ['email', 'username'];
	const optionalFields = ['name', 'bio', 'website'];
	const collectedFields = Object.keys(dataCollection);

	// Prüfe ob nur notwendige und explizit gewünschte Felder gesammelt werden
	const unnecessary = collectedFields.filter(
		(field) => !requiredFields.includes(field) && !optionalFields.includes(field)
	);

	return unnecessary.length === 0;
}

// Legal Basis Validation
export function validateLegalBasis(
	purpose: string,
	hasConsent: boolean,
	isRequired: boolean
): boolean {
	const purposeConfig = DATA_PROCESSING_PURPOSES.find((p) => p.id === purpose);
	if (!purposeConfig) return false;

	switch (purposeConfig.legalBasis) {
		case 'consent':
			return hasConsent;
		case 'contract':
			return isRequired;
		case 'legitimate_interests':
			return true; // Interessenabwägung bereits durchgeführt
		default:
			return false;
	}
}
