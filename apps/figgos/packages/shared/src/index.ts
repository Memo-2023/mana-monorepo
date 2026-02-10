export type FigureRarity = 'common' | 'rare' | 'epic' | 'legendary';

export const RARITY_WEIGHTS: Record<FigureRarity, number> = {
	common: 60,
	rare: 25,
	epic: 12,
	legendary: 3,
};

export interface FigureUserInput {
	description: string;
}

export interface FigureResponse {
	id: string;
	userId: string;
	name: string;
	userInput: FigureUserInput;
	imageUrl: string | null;
	rarity: FigureRarity;
	isPublic: boolean;
	isArchived: boolean;
	createdAt: string;
	updatedAt: string;
}
