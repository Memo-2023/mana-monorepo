/**
 * Food constants — meal labels, nutrient info, default values.
 *
 * Inlined from @food/shared to avoid the cross-app dependency.
 */

// Default daily recommended values (based on 2000 kcal diet)
export const DEFAULT_DAILY_VALUES = {
	calories: 2000,
	protein: 50,
	carbohydrates: 275,
	fat: 78,
	fiber: 28,
	sugar: 50,
} as const;

// Meal type labels
export const MEAL_TYPE_LABELS = {
	breakfast: { de: 'Fruhstuck', en: 'Breakfast' },
	lunch: { de: 'Mittagessen', en: 'Lunch' },
	dinner: { de: 'Abendessen', en: 'Dinner' },
	snack: { de: 'Snack', en: 'Snack' },
} as const;

// Nutrient display info
export const NUTRIENT_INFO = {
	calories: { label: 'Kalorien', unit: 'kcal', color: '#F59E0B' },
	protein: { label: 'Protein', unit: 'g', color: '#EF4444' },
	carbohydrates: { label: 'Kohlenhydrate', unit: 'g', color: '#3B82F6' },
	fat: { label: 'Fett', unit: 'g', color: '#8B5CF6' },
	fiber: { label: 'Ballaststoffe', unit: 'g', color: '#10B981' },
	sugar: { label: 'Zucker', unit: 'g', color: '#EC4899' },
} as const;

/**
 * Suggest meal type based on current time of day.
 */
export function suggestMealType(): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
	const hour = new Date().getHours();
	if (hour >= 5 && hour < 11) return 'breakfast';
	if (hour >= 11 && hour < 14) return 'lunch';
	if (hour >= 17 && hour < 21) return 'dinner';
	return 'snack';
}
