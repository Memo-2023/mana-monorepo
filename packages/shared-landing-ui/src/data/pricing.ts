/**
 * Centralized Mana Pricing Data
 *
 * This file contains all pricing plans and packages for the Mana credit system.
 * Used across all landing pages for consistent pricing display.
 */

export interface SubscriptionPlan {
	id: string;
	name: string;
	price: number;
	priceText: string;
	monthlyEquivalent?: number;
	startMana: number;
	regeneration: number;
	storage: number;
	icon: string;
	popular: boolean;
	features: string[];
}

export interface ManaPackage {
	id: string;
	name: string;
	price: number;
	priceText: string;
	mana: number;
	icon: string;
	pricePerMana: number;
}

export interface PricingTranslations {
	// Section headers
	sectionTitle: string;
	sectionSubtitle: string;
	// Billing toggle
	monthly: string;
	yearly: string;
	yearlyDiscount: string;
	// Card labels
	startMana: string;
	regeneration: string;
	maxStorage: string;
	manaPerDay: string;
	manaCredits: string;
	perMonth: string;
	perYear: string;
	perMonthEquivalent: string;
	free: string;
	// CTA
	getStarted: string;
	selectPlan: string;
	// One-time section
	oneTimeTitle: string;
	oneTimeSubtitle: string;
	// Trust indicators
	trustTitle: string;
	trustSavings: string;
	trustSavingsDesc: string;
	trustTeam: string;
	trustTeamDesc: string;
	trustControl: string;
	trustControlDesc: string;
	trustInstant: string;
	trustInstantDesc: string;
}

// Default German translations
export const defaultPricingTranslations: PricingTranslations = {
	sectionTitle: 'Transparente Preise für jeden Bedarf',
	sectionSubtitle:
		'Wählen Sie zwischen monatlichen Abos mit täglicher Regeneration oder einmaligen Mana-Käufen. Keine versteckten Kosten, keine Mindestlaufzeiten.',
	monthly: 'Monatlich',
	yearly: 'Jährlich',
	yearlyDiscount: '2 Monate gratis',
	startMana: 'Start-Mana',
	regeneration: 'Regeneration',
	maxStorage: 'Max. Speicher',
	manaPerDay: 'Mana/Tag',
	manaCredits: 'Mana Credits',
	perMonth: 'pro Monat',
	perYear: 'pro Jahr',
	perMonthEquivalent: '€ pro Monat',
	free: 'Kostenlos',
	getStarted: 'Jetzt starten',
	selectPlan: 'Plan auswählen',
	oneTimeTitle: 'Einmalige Mana-Käufe',
	oneTimeSubtitle:
		'Brauchen Sie sofort mehr Mana? Kaufen Sie Mana-Tränke ohne Abo – perfekt für Projekte oder als Geschenk.',
	trustTitle: 'Warum Mana das bessere Preismodell ist',
	trustSavings: 'Bis zu 90% sparen',
	trustSavingsDesc: 'Gegenüber einzelnen Tool-Abos',
	trustTeam: 'Team-freundlich',
	trustTeamDesc: 'Mana teilen im Team möglich',
	trustControl: 'Volle Kostenkontrolle',
	trustControlDesc: 'Detaillierte Nutzungsstatistiken',
	trustInstant: 'Sofort alle Tools',
	trustInstantDesc: 'Keine Wartezeiten oder Verhandlungen',
};

// English translations
export const englishPricingTranslations: PricingTranslations = {
	sectionTitle: 'Transparent pricing for every need',
	sectionSubtitle:
		'Choose between monthly subscriptions with daily regeneration or one-time Mana purchases. No hidden costs, no minimum terms.',
	monthly: 'Monthly',
	yearly: 'Yearly',
	yearlyDiscount: '2 months free',
	startMana: 'Starting Mana',
	regeneration: 'Regeneration',
	maxStorage: 'Max. Storage',
	manaPerDay: 'Mana/day',
	manaCredits: 'Mana Credits',
	perMonth: 'per month',
	perYear: 'per year',
	perMonthEquivalent: '€ per month',
	free: 'Free',
	getStarted: 'Get started',
	selectPlan: 'Select plan',
	oneTimeTitle: 'One-time Mana purchases',
	oneTimeSubtitle:
		'Need more Mana right now? Buy Mana potions without a subscription – perfect for projects or as a gift.',
	trustTitle: 'Why Mana is the better pricing model',
	trustSavings: 'Save up to 90%',
	trustSavingsDesc: 'Compared to individual tool subscriptions',
	trustTeam: 'Team-friendly',
	trustTeamDesc: 'Share Mana with your team',
	trustControl: 'Full cost control',
	trustControlDesc: 'Detailed usage statistics',
	trustInstant: 'Instant access to all tools',
	trustInstantDesc: 'No waiting or negotiations',
};

export const pricingPlans = {
	monthly: [
		{
			id: 'tropfen',
			name: 'Mana Tropfen',
			price: 0,
			priceText: 'Kostenlos',
			startMana: 150,
			regeneration: 5,
			storage: 150,
			icon: '💧',
			popular: false,
			features: ['150 Start-Mana', '5 Mana täglich', '150 Mana Speicher', 'Basis KI-Tools'],
		},
		{
			id: 'kleiner-stream',
			name: 'Kleiner Stream',
			price: 5.99,
			priceText: '5,99€',
			startMana: 600,
			regeneration: 20,
			storage: 600,
			icon: '🌊',
			popular: false,
			features: ['600 Start-Mana', '20 Mana täglich', '600 Mana Speicher', 'Alle Apps verfügbar'],
		},
		{
			id: 'mittlerer-stream',
			name: 'Mittlerer Stream',
			price: 14.99,
			priceText: '14,99€',
			startMana: 1500,
			regeneration: 50,
			storage: 1500,
			icon: '💫',
			popular: true,
			features: ['1.500 Start-Mana', '50 Mana täglich', '1.500 Mana Speicher', 'Priority Support'],
		},
		{
			id: 'grosser-stream',
			name: 'Großer Stream',
			price: 29.99,
			priceText: '29,99€',
			startMana: 3000,
			regeneration: 100,
			storage: 3000,
			icon: '⭐',
			popular: false,
			features: ['3.000 Start-Mana', '100 Mana täglich', '3.000 Mana Speicher', 'Premium Support'],
		},
		{
			id: 'riesiger-stream',
			name: 'Riesiger Stream',
			price: 49.99,
			priceText: '49,99€',
			startMana: 5000,
			regeneration: 167,
			storage: 5000,
			icon: '🌟',
			popular: false,
			features: [
				'5.000 Start-Mana',
				'167 Mana täglich',
				'5.000 Mana Speicher',
				'Enterprise Features',
			],
		},
	] as SubscriptionPlan[],
	yearly: [
		{
			id: 'tropfen',
			name: 'Mana Tropfen',
			price: 0,
			priceText: 'Kostenlos',
			monthlyEquivalent: 0,
			startMana: 150,
			regeneration: 5,
			storage: 150,
			icon: '💧',
			popular: false,
			features: ['150 Start-Mana', '5 Mana täglich', '150 Mana Speicher', 'Basis KI-Tools'],
		},
		{
			id: 'kleiner-stream',
			name: 'Kleiner Stream',
			price: 59.9,
			priceText: '59,90€',
			monthlyEquivalent: 4.99,
			startMana: 600,
			regeneration: 20,
			storage: 600,
			icon: '🌊',
			popular: false,
			features: [
				'600 Start-Mana',
				'20 Mana täglich',
				'600 Mana Speicher',
				'Alle Apps verfügbar',
				'✨ 2 Monate gespart',
			],
		},
		{
			id: 'mittlerer-stream',
			name: 'Mittlerer Stream',
			price: 149.9,
			priceText: '149,90€',
			monthlyEquivalent: 12.49,
			startMana: 1500,
			regeneration: 50,
			storage: 1500,
			icon: '💫',
			popular: true,
			features: [
				'1.500 Start-Mana',
				'50 Mana täglich',
				'1.500 Mana Speicher',
				'Priority Support',
				'✨ 2 Monate gespart',
			],
		},
		{
			id: 'grosser-stream',
			name: 'Großer Stream',
			price: 299.9,
			priceText: '299,90€',
			monthlyEquivalent: 24.99,
			startMana: 3000,
			regeneration: 100,
			storage: 3000,
			icon: '⭐',
			popular: false,
			features: [
				'3.000 Start-Mana',
				'100 Mana täglich',
				'3.000 Mana Speicher',
				'Premium Support',
				'✨ 2 Monate gespart',
			],
		},
		{
			id: 'riesiger-stream',
			name: 'Riesiger Stream',
			price: 499.9,
			priceText: '499,90€',
			monthlyEquivalent: 41.66,
			startMana: 5000,
			regeneration: 167,
			storage: 5000,
			icon: '🌟',
			popular: false,
			features: [
				'5.000 Start-Mana',
				'167 Mana täglich',
				'5.000 Mana Speicher',
				'Enterprise Features',
				'✨ 2 Monate gespart',
			],
		},
	] as SubscriptionPlan[],
	oneTime: [
		{
			id: 'small',
			name: 'Kleiner Mana Trank',
			price: 4.99,
			priceText: '4,99€',
			mana: 350,
			icon: '🧪',
			pricePerMana: 0.0143,
		},
		{
			id: 'medium',
			name: 'Mittlerer Mana Trank',
			price: 9.99,
			priceText: '9,99€',
			mana: 700,
			icon: '⚗️',
			pricePerMana: 0.0143,
		},
		{
			id: 'large',
			name: 'Großer Mana Trank',
			price: 19.99,
			priceText: '19,99€',
			mana: 1400,
			icon: '🏺',
			pricePerMana: 0.0143,
		},
		{
			id: 'huge',
			name: 'Riesiger Mana Trank',
			price: 39.99,
			priceText: '39,99€',
			mana: 2800,
			icon: '🏛️',
			pricePerMana: 0.0143,
		},
	] as ManaPackage[],
};

// Helper functions
export function formatPrice(price: number, locale = 'de-DE'): string {
	if (price === 0) return locale === 'de-DE' ? 'Kostenlos' : 'Free';
	return price.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatMana(value: number, locale = 'de-DE'): string {
	return value.toLocaleString(locale);
}

export function getMonthlyValue(regenerationPerDay: number, daysInMonth = 30): number {
	return regenerationPerDay * daysInMonth;
}

export function getYearlyValue(regenerationPerDay: number): number {
	return regenerationPerDay * 365;
}
