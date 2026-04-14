// Default daily recommended values (based on 2000 kcal diet)
export const DEFAULT_DAILY_VALUES = {
	calories: 2000,
	protein: 50, // grams
	carbohydrates: 275, // grams
	fat: 78, // grams
	fiber: 28, // grams
	sugar: 50, // grams (max)
	saturatedFat: 20, // grams (max)
	// Vitamins
	vitaminA: 900, // µg RAE
	vitaminB1: 1.2, // mg
	vitaminB2: 1.3, // mg
	vitaminB3: 16, // mg
	vitaminB5: 5, // mg
	vitaminB6: 1.7, // mg
	vitaminB7: 30, // µg
	vitaminB9: 400, // µg
	vitaminB12: 2.4, // µg
	vitaminC: 90, // mg
	vitaminD: 20, // µg
	vitaminE: 15, // mg
	vitaminK: 120, // µg
	// Minerals
	calcium: 1000, // mg
	iron: 18, // mg
	magnesium: 420, // mg
	phosphorus: 700, // mg
	potassium: 4700, // mg
	sodium: 2300, // mg (max)
	zinc: 11, // mg
	copper: 0.9, // mg
	manganese: 2.3, // mg
	selenium: 55, // µg
} as const;

// Meal type labels
export const MEAL_TYPE_LABELS = {
	breakfast: {
		de: 'Frühstück',
		en: 'Breakfast',
	},
	lunch: {
		de: 'Mittagessen',
		en: 'Lunch',
	},
	dinner: {
		de: 'Abendessen',
		en: 'Dinner',
	},
	snack: {
		de: 'Snack',
		en: 'Snack',
	},
} as const;

// Nutrient categories for UI grouping
export const NUTRIENT_CATEGORIES = {
	macros: ['calories', 'protein', 'carbohydrates', 'fat', 'fiber', 'sugar'],
	vitamins: [
		'vitaminA',
		'vitaminB1',
		'vitaminB2',
		'vitaminB3',
		'vitaminB5',
		'vitaminB6',
		'vitaminB7',
		'vitaminB9',
		'vitaminB12',
		'vitaminC',
		'vitaminD',
		'vitaminE',
		'vitaminK',
	],
	minerals: [
		'calcium',
		'iron',
		'magnesium',
		'phosphorus',
		'potassium',
		'sodium',
		'zinc',
		'copper',
		'manganese',
		'selenium',
	],
} as const;

// Nutrient display info
export const NUTRIENT_INFO = {
	calories: { label: 'Kalorien', unit: 'kcal', color: '#F59E0B' },
	protein: { label: 'Protein', unit: 'g', color: '#EF4444' },
	carbohydrates: { label: 'Kohlenhydrate', unit: 'g', color: '#3B82F6' },
	fat: { label: 'Fett', unit: 'g', color: '#8B5CF6' },
	fiber: { label: 'Ballaststoffe', unit: 'g', color: '#10B981' },
	sugar: { label: 'Zucker', unit: 'g', color: '#EC4899' },
	vitaminA: { label: 'Vitamin A', unit: 'µg', color: '#F97316' },
	vitaminC: { label: 'Vitamin C', unit: 'mg', color: '#FBBF24' },
	vitaminD: { label: 'Vitamin D', unit: 'µg', color: '#A3E635' },
	calcium: { label: 'Calcium', unit: 'mg', color: '#E5E7EB' },
	iron: { label: 'Eisen', unit: 'mg', color: '#78716C' },
	magnesium: { label: 'Magnesium', unit: 'mg', color: '#06B6D4' },
} as const;

// Credit costs per action
export const CREDIT_COSTS = {
	photoAnalysis: 5,
	textAnalysis: 2,
	aiCoaching: 10,
} as const;

// Theme colors
export const FOOD_COLORS = {
	primary: '#22C55E', // Green 500
	primaryHover: '#16A34A', // Green 600
	primaryLight: '#86EFAC', // Green 300
	secondary: '#F97316', // Orange 500
	accent: '#14B8A6', // Teal 500
	background: '#0F1F0F', // Dark green tinted
	backgroundCard: '#1A2F1A',
	textPrimary: '#F0FDF4', // Green 50
	textSecondary: '#BBF7D0', // Green 200
	border: '#22543D', // Green 800
} as const;
