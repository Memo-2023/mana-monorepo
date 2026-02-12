// ── Rarity ──

export type FigureRarity = 'common' | 'rare' | 'epic' | 'legendary';

export const RARITY_WEIGHTS: Record<FigureRarity, number> = {
	common: 60,
	rare: 25,
	epic: 12,
	legendary: 3,
};

export const STAT_RANGES: Record<FigureRarity, { min: number; max: number }> = {
	common: { min: 10, max: 45 },
	rare: { min: 30, max: 65 },
	epic: { min: 50, max: 85 },
	legendary: { min: 75, max: 100 },
};

// ── Card Styles (internal — used for image generation, not persisted) ──

export type CardStyle =
	| 'common_kraft'
	| 'common_white'
	| 'common_mint'
	| 'common_warm'
	| 'rare'
	| 'epic'
	| 'legendary';

const COMMON_STYLES: CardStyle[] = ['common_kraft', 'common_white', 'common_mint', 'common_warm'];

/** Pick a card style for image generation. Common gets a random variant, others match rarity. */
export function getCardStyle(rarity: FigureRarity): CardStyle {
	if (rarity === 'common') {
		return COMMON_STYLES[Math.floor(Math.random() * COMMON_STYLES.length)];
	}
	return rarity as CardStyle;
}

// ── Language ──

export type FigureLanguage = 'en' | 'de';

// ── Generation Status ──

export type FigureStatus =
	| 'pending'
	| 'generating_profile'
	| 'generating_image'
	| 'processing'
	| 'completed'
	| 'failed';

// ── User Input (what the user provides) ──

export interface FigureUserInput {
	description: string;
	language: FigureLanguage;
}

// ── Generated Profile (what the LLM produces) ──

export interface FigureItem {
	name: string;
	description: string;
	lore: string;
}

export interface FigureStats {
	attack: number;
	defense: number;
	special: number;
}

export interface SpecialAttack {
	name: string;
	description: string;
}

export interface GeneratedProfile {
	subtitle: string;
	backstory: string;
	visualDescription: string;
	items: FigureItem[];
	stats: FigureStats;
	specialAttack: SpecialAttack;
}

// ── API Response ──

export interface FigureResponse {
	id: string;
	userId: string;
	name: string;
	userInput: FigureUserInput;
	generatedProfile: GeneratedProfile | null;
	imageUrl: string | null;
	rarity: FigureRarity;
	language: FigureLanguage;
	status: FigureStatus;
	isPublic: boolean;
	errorMessage: string | null;
	isArchived: boolean;
	createdAt: string;
	updatedAt: string;
}
