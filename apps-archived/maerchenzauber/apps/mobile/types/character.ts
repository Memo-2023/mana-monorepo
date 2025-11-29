export interface CharacterTraits {
	age: number;
	hairColor: string;
	eyeColor: string;
	skinTone: string;
	ethnicity: 'Hispanic' | 'Black' | 'White' | 'Asian' | 'Middle Eastern' | 'Other';
	gender: string;
}

export interface Character {
	uid: string;
	name: string;
	originalDescription: string;
	characterDescriptionPrompt: string;
	images: CustomImage[];
	imageUrl: string;
	createdAt: Date;
	archived?: boolean;
	animalType?: string;
	isAnimal?: boolean;
	blur_hash?: string; // BlurHash for smooth image placeholder
	share_code?: string; // Share code for universal links
	isFeatured?: boolean; // Hardcoded featured character
}

export interface CustomImage {
	description: string;
	imageUrl: string;
}
