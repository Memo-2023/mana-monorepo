export interface Deck {
	id: string;
	user_id: string;
	title: string;
	description?: string;
	cover_image_url?: string;
	is_public: boolean;
	settings: Record<string, any>;
	tags: string[];
	metadata: Record<string, any>;
	created_at: string;
	updated_at: string;
	card_count?: number;
}

export interface CreateDeckInput {
	title: string;
	description?: string;
	is_public?: boolean;
	tags?: string[];
	settings?: Record<string, any>;
}

export interface UpdateDeckInput {
	title?: string;
	description?: string;
	is_public?: boolean;
	tags?: string[];
	settings?: Record<string, any>;
}
