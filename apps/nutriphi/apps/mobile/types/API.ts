// Gemini API Response Typen
export interface GeminiAnalysisResult {
	meal_analysis: {
		total_calories: number;
		total_protein: number;
		total_carbs: number;
		total_fat: number;
		total_fiber?: number;
		total_sugar?: number;
		health_score: number; // 1.0-10.0
		health_category: 'healthy' | 'moderate' | 'unhealthy';
		confidence: number; // 0.0-1.0
		meal_type_suggestion?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
	};
	food_items: GeminiFoodItem[];
	analysis_notes: {
		health_reasoning: string;
		improvement_suggestions: string[];
		cooking_method: string;
		estimated_freshness: string;
		hidden_ingredients: string[];
		portion_accuracy: 'low' | 'medium' | 'high';
	};
	_metadata?: {
		processingTime: number;
		apiProvider: string;
		model: string;
		timestamp: string;
	};
}

export interface GeminiFoodItem {
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
	calories: number;
	protein: number;
	carbs: number;
	fat: number;
	fiber?: number;
	sugar?: number;
	confidence: number;
	is_organic: boolean;
	is_processed: boolean;
	allergens: string[];
}

// API Error Types
export interface APIError {
	code: string;
	message: string;
	details?: any;
}

// Prompt Context Types
export interface PromptContext {
	mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
	location?: 'restaurant' | 'homemade' | 'fastfood';
	additional?: string;
}

// Gemini Error Class
export class GeminiError extends Error {
	public readonly code: string;
	public readonly type: 'TEMPORARY' | 'PERMANENT';
	public readonly metadata?: any;

	constructor(message: string, code: string, type: 'TEMPORARY' | 'PERMANENT', metadata?: any) {
		super(message);
		this.name = 'GeminiError';
		this.code = code;
		this.type = type;
		this.metadata = metadata;
	}
}

export interface AnalysisRequest {
	imageBase64: string;
	context?: PromptContext;
	mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface AnalysisResponse {
	success: boolean;
	data?: GeminiAnalysisResult;
	error?: APIError;
	processingTime: number;
	cost?: number;
}
