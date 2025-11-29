/**
 * Character Types for Märchenzauber Web App
 */

export interface CustomImage {
	description: string;
	imageUrl: string;
}

export interface Character {
	id: string;
	uid?: string; // Legacy field
	name: string;
	originalDescription: string;
	characterDescriptionPrompt: string;
	images: CustomImage[];
	imageUrl: string;
	image_url?: string; // Backend naming convention
	createdAt: string;
	user_id: string;
	archived?: boolean;
	animalType?: string;
	isAnimal?: boolean;
	blur_hash?: string;
	share_code?: string;
	isFeatured?: boolean;
	// Voting fields for public characters
	vote_count?: number;
	user_vote?: 'like' | 'love' | 'star' | null;
}

export interface CharactersResponse {
	data: Character[];
	error?: string;
}

export interface PublicCharactersResponse {
	characters: Character[];
	hasMore: boolean;
	total: number;
}

export interface CharacterCollection {
	id: string;
	name: string;
	description?: string;
	image_url?: string;
}

export interface CreateCharacterRequest {
	name: string;
	description: string;
	isAnimal?: boolean;
	animalType?: string;
}

export interface GenerateCharacterImagesRequest {
	name: string;
	description: string;
	isAnimal?: boolean;
	animalType?: string;
	photo?: File;
}

// System user ID for system characters (read-only, visible to all)
export const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

export function isSystemCharacter(character: Character): boolean {
	return character.user_id === SYSTEM_USER_ID;
}
