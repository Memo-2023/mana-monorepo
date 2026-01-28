export default () => ({
	port: parseInt(process.env.PORT || '3303', 10),
	telegram: {
		token: process.env.TELEGRAM_BOT_TOKEN,
		allowedUsers: process.env.TELEGRAM_ALLOWED_USERS
			? process.env.TELEGRAM_ALLOWED_USERS.split(',').map((id) => parseInt(id.trim(), 10))
			: [],
	},
	database: {
		url:
			process.env.DATABASE_URL || 'postgresql://manacore:devpassword@localhost:5432/nutriphi_bot',
	},
	gemini: {
		apiKey: process.env.GEMINI_API_KEY,
	},
});

// Meal type labels
export const MEAL_TYPES = {
	breakfast: 'Frühstück',
	lunch: 'Mittagessen',
	dinner: 'Abendessen',
	snack: 'Snack',
} as const;

export type MealType = keyof typeof MEAL_TYPES;

// Get suggested meal type based on current time
export function suggestMealType(): MealType {
	const hour = new Date().getHours();
	if (hour >= 5 && hour < 11) return 'breakfast';
	if (hour >= 11 && hour < 15) return 'lunch';
	if (hour >= 17 && hour < 21) return 'dinner';
	return 'snack';
}
