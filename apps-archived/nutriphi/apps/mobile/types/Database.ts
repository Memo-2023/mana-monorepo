export interface Meal {
	id?: number;
	cloud_id?: string;
	user_id?: string;
	sync_status: 'local' | 'synced' | 'conflict' | 'pending';
	version: number;
	last_sync_at?: string;
	photo_path: string;
	photo_url?: string;
	photo_size?: number;
	photo_dimensions?: string; // JSON: {"width": 1920, "height": 1080}
	timestamp: string;
	created_at: string;
	updated_at: string;
	meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
	location?: string;
	latitude?: number;
	longitude?: number;
	location_accuracy?: number;
	analysis_result?: string; // JSON der Gemini-Antwort
	analysis_confidence?: number;
	analysis_status: 'pending' | 'completed' | 'failed' | 'manual';
	total_calories?: number;
	total_protein?: number;
	total_carbs?: number;
	total_fat?: number;
	total_fiber?: number;
	total_sugar?: number;
	health_score?: number; // 1.0 - 10.0
	health_category?: 'very_healthy' | 'healthy' | 'moderate' | 'unhealthy';
	user_notes?: string;
	user_modified: number; // Boolean als Integer
	user_rating?: number; // 1-5 Sterne
	api_provider: string;
	api_cost?: number; // Kosten in Cent
	processing_time?: number; // Millisekunden
}

export interface FoodItem {
	id?: number;
	cloud_id?: string;
	meal_id: number;
	sync_status: 'local' | 'synced' | 'conflict' | 'pending';
	version: number;
	name: string;
	category:
		| 'protein'
		| 'vegetable'
		| 'grain'
		| 'fruit'
		| 'dairy'
		| 'fat'
		| 'processed'
		| 'beverage';
	portion_size: string;
	calories?: number;
	protein?: number;
	carbs?: number;
	fat?: number;
	fiber?: number;
	sugar?: number;
	confidence?: number; // 0.0 - 1.0
	bounding_box?: string; // JSON: Position im Bild
	is_organic: number; // Boolean als Integer
	is_processed: number; // Boolean als Integer
	allergens?: string; // JSON Array
	created_at: string;
}

export interface SyncMetadata {
	table_name: string;
	record_id: number;
	cloud_id?: string;
	last_sync_at?: string;
	conflict_data?: string; // JSON für Konfliktlösung
	retry_count: number;
}

export interface PhotoDimensions {
	width: number;
	height: number;
}

// Eingabe für neue Mahlzeiten
export interface CreateMealInput {
	photo_path: string;
	photo_size?: number;
	photo_dimensions?: PhotoDimensions;
	meal_type?: Meal['meal_type'];
	location?: string;
	user_notes?: string;
	analysis_status?: Meal['analysis_status'];
}

// Eingabe für neue Lebensmittel
export interface CreateFoodItemInput {
	meal_id: number;
	name: string;
	category?: FoodItem['category'];
	portion_size?: string;
	calories?: number;
	protein?: number;
	carbs?: number;
	fat?: number;
	fiber?: number;
	sugar?: number;
	confidence?: number;
	is_organic?: number;
	is_processed?: number;
	allergens?: string;
}

// Vollständige Mahlzeit mit FoodItems
export interface MealWithItems extends Meal {
	food_items: FoodItem[];
}
