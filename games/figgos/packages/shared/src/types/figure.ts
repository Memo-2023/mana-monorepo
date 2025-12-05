/**
 * Figure rarity levels
 */
export type FigureRarity = 'common' | 'rare' | 'epic' | 'legendary';

/**
 * Character item/artifact
 */
export interface FigureItem {
	name: string;
	description: string;
	imagePrompt: string;
	lore: string;
}

/**
 * Character information structure
 */
export interface CharacterInfo {
	character: {
		description: string;
		imagePrompt: string;
		lore: string;
	};
	items: FigureItem[];
	styleDescription?: string;
}

/**
 * Main Figure entity
 */
export interface Figure {
	id: string;
	name: string;
	subject: string;
	imageUrl: string;
	enhancedPrompt?: string;
	rarity: FigureRarity;
	characterInfo: CharacterInfo;
	isPublic: boolean;
	isArchived: boolean;
	likes: number;
	userId: string;
	createdAt: string;
}

/**
 * Figure creation input
 */
export interface CreateFigureInput {
	name: string;
	characterDescription?: string;
	rarity?: FigureRarity;
	characterImage?: string;
	artifacts: Array<{
		name?: string;
		description?: string;
	}>;
	isPublic?: boolean;
}

/**
 * Figure generation response
 */
export interface GenerateFigureResponse {
	id: string;
	name: string;
	imageUrl: string;
	enhancedPrompt: string;
	rarity: FigureRarity;
	characterInfo: CharacterInfo;
}

/**
 * Figure like entity
 */
export interface FigureLike {
	id: string;
	figureId: string;
	userId: string;
	createdAt: string;
}

/**
 * Public figure list item (for community feed)
 */
export interface PublicFigure
	extends Pick<
		Figure,
		| 'id'
		| 'name'
		| 'subject'
		| 'imageUrl'
		| 'enhancedPrompt'
		| 'likes'
		| 'rarity'
		| 'characterInfo'
		| 'userId'
		| 'createdAt'
	> {
	hasLiked?: boolean;
}

/**
 * User's figure list item (for shelf/collection)
 */
export interface UserFigure
	extends Pick<
		Figure,
		| 'id'
		| 'name'
		| 'subject'
		| 'imageUrl'
		| 'likes'
		| 'isPublic'
		| 'rarity'
		| 'isArchived'
		| 'characterInfo'
	> {}
