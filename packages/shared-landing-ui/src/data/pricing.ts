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
	yearlyDiscount: '20% Rabatt',
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
	yearlyDiscount: '20% off',
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
			id: 'free',
			name: 'Mana Quelle Free',
			price: 0,
			priceText: 'Kostenlos',
			startMana: 50,
			regeneration: 2,
			storage: 50,
			icon: '💧',
			popular: false,
			features: ['50 Mana pro Monat', '2 Mana täglich', 'Zugang zu allen Apps', 'Basis KI-Tools'],
		},
		{
			id: 'quelle-s',
			name: 'Mana Quelle S',
			price: 4.99,
			priceText: '4,99€',
			startMana: 500,
			regeneration: 17,
			storage: 500,
			icon: '🌊',
			popular: false,
			features: ['500 Mana pro Monat', '17 Mana täglich', 'Alle Apps verfügbar', 'E-Mail Support'],
		},
		{
			id: 'quelle-m',
			name: 'Mana Quelle M',
			price: 9.99,
			priceText: '9,99€',
			startMana: 1000,
			regeneration: 33,
			storage: 1000,
			icon: '💫',
			popular: true,
			features: ['1.000 Mana pro Monat', '33 Mana täglich', 'Alle AI-Modelle', 'Priority Support'],
		},
		{
			id: 'quelle-l',
			name: 'Mana Quelle L',
			price: 19.99,
			priceText: '19,99€',
			startMana: 2000,
			regeneration: 67,
			storage: 2000,
			icon: '⭐',
			popular: false,
			features: ['2.000 Mana pro Monat', '67 Mana täglich', 'Premium AI-Modelle', 'API-Zugang'],
		},
		{
			id: 'quelle-xl',
			name: 'Mana Quelle XL',
			price: 39.99,
			priceText: '39,99€',
			startMana: 4000,
			regeneration: 133,
			storage: 4000,
			icon: '🌟',
			popular: false,
			features: [
				'4.000 Mana pro Monat',
				'133 Mana täglich',
				'Team-Features',
				'Dedizierter Support',
			],
		},
		{
			id: 'quelle-xxl',
			name: 'Mana Quelle XXL',
			price: 99.99,
			priceText: '99,99€',
			startMana: 10000,
			regeneration: 333,
			storage: 10000,
			icon: '✨',
			popular: false,
			features: [
				'10.000 Mana pro Monat',
				'333 Mana täglich',
				'Enterprise Features',
				'Custom Integrationen',
			],
		},
	] as SubscriptionPlan[],
	yearly: [
		{
			id: 'free',
			name: 'Mana Quelle Free',
			price: 0,
			priceText: 'Kostenlos',
			monthlyEquivalent: 0,
			startMana: 50,
			regeneration: 2,
			storage: 50,
			icon: '💧',
			popular: false,
			features: ['50 Mana pro Monat', '2 Mana täglich', 'Zugang zu allen Apps', 'Basis KI-Tools'],
		},
		{
			id: 'quelle-s',
			name: 'Mana Quelle S',
			price: 47.9,
			priceText: '47,90€',
			monthlyEquivalent: 3.99,
			startMana: 500,
			regeneration: 17,
			storage: 500,
			icon: '🌊',
			popular: false,
			features: [
				'500 Mana pro Monat',
				'17 Mana täglich',
				'Alle Apps verfügbar',
				'E-Mail Support',
				'20% gespart',
			],
		},
		{
			id: 'quelle-m',
			name: 'Mana Quelle M',
			price: 95.9,
			priceText: '95,90€',
			monthlyEquivalent: 7.99,
			startMana: 1000,
			regeneration: 33,
			storage: 1000,
			icon: '💫',
			popular: true,
			features: [
				'1.000 Mana pro Monat',
				'33 Mana täglich',
				'Alle AI-Modelle',
				'Priority Support',
				'20% gespart',
			],
		},
		{
			id: 'quelle-l',
			name: 'Mana Quelle L',
			price: 191.9,
			priceText: '191,90€',
			monthlyEquivalent: 15.99,
			startMana: 2000,
			regeneration: 67,
			storage: 2000,
			icon: '⭐',
			popular: false,
			features: [
				'2.000 Mana pro Monat',
				'67 Mana täglich',
				'Premium AI-Modelle',
				'API-Zugang',
				'20% gespart',
			],
		},
		{
			id: 'quelle-xl',
			name: 'Mana Quelle XL',
			price: 383.9,
			priceText: '383,90€',
			monthlyEquivalent: 31.99,
			startMana: 4000,
			regeneration: 133,
			storage: 4000,
			icon: '🌟',
			popular: false,
			features: [
				'4.000 Mana pro Monat',
				'133 Mana täglich',
				'Team-Features',
				'Dedizierter Support',
				'20% gespart',
			],
		},
		{
			id: 'quelle-xxl',
			name: 'Mana Quelle XXL',
			price: 959.9,
			priceText: '959,90€',
			monthlyEquivalent: 79.99,
			startMana: 10000,
			regeneration: 333,
			storage: 10000,
			icon: '✨',
			popular: false,
			features: [
				'10.000 Mana pro Monat',
				'333 Mana täglich',
				'Enterprise Features',
				'Custom Integrationen',
				'20% gespart',
			],
		},
	] as SubscriptionPlan[],
	oneTime: [
		{
			id: 'small',
			name: 'Kleiner Mana Trank',
			price: 4.9,
			priceText: '4,90€',
			mana: 350,
			icon: '🧪',
			pricePerMana: 0.014,
		},
		{
			id: 'medium',
			name: 'Mittlerer Mana Trank',
			price: 9.8,
			priceText: '9,80€',
			mana: 700,
			icon: '⚗️',
			pricePerMana: 0.014,
		},
		{
			id: 'large',
			name: 'Großer Mana Trank',
			price: 19.6,
			priceText: '19,60€',
			mana: 1400,
			icon: '🏺',
			pricePerMana: 0.014,
		},
		{
			id: 'huge',
			name: 'Riesiger Mana Trank',
			price: 39.2,
			priceText: '39,20€',
			mana: 2800,
			icon: '🏛️',
			pricePerMana: 0.014,
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
