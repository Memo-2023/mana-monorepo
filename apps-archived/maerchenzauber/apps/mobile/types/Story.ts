export interface StoryPage {
	image: string;
	pageNumber: number;
	story: string;
	blur_hash?: string; // BlurHash for smooth image placeholder
}

export interface Story {
	characterId: string;
	characterName: string;
	createdAt: Date;
	prompt: string;
	pages: StoryPage[];
	text: string;
	user_id: string;
	title: string;
	archived?: boolean;
	// Favorite status for own stories
	is_favorite?: boolean;
	// New fields for central/collection support
	visibility?: 'private' | 'public' | 'central' | 'featured';
	is_published?: boolean;
	published_at?: Date;
	published_by?: string;
	featured_score?: number;
	metadata?: {
		version?: number;
		language?: string;
		age_group?: string;
		author?: string;
		illustrator?: string;
		[key: string]: any;
	};
	// Collection-related fields
	is_central?: boolean;
	collection_position?: number;
}

export interface StoryCollection {
	id: string;
	slug: string;
	name: string;
	description?: string;
	type: 'manual' | 'automatic' | 'contest' | 'seasonal';
	is_active: boolean;
	sort_order: number;
	config?: Record<string, any>;
	created_at: Date;
	updated_at: Date;
}

export interface StoriesWithCollections {
	userStories: Story[];
	centralStories: Story[];
	allStories: Story[];
}
