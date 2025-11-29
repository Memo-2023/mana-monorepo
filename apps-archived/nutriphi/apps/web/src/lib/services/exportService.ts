/**
 * Export Service for Nutriphi Web
 * Generates CSV and PDF exports of meal data
 */

import type { Meal } from '$lib/types/meal';
import type { ExportOptions } from '$lib/types/stats';
import type { NutritionGoal, DailyProgress } from '$lib/types/goal';

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
	return new Date(dateString).toLocaleDateString('de-DE', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});
}

/**
 * Get meal type label in German
 */
function getMealTypeLabel(type: string): string {
	const labels: Record<string, string> = {
		breakfast: 'Frühstück',
		lunch: 'Mittagessen',
		dinner: 'Abendessen',
		snack: 'Snack',
	};
	return labels[type] || type;
}

/**
 * Export meals to CSV
 */
export function exportToCSV(meals: Meal[]): Blob {
	const headers = [
		'Datum',
		'Uhrzeit',
		'Mahlzeit',
		'Kalorien (kcal)',
		'Protein (g)',
		'Kohlenhydrate (g)',
		'Fett (g)',
		'Ballaststoffe (g)',
		'Zucker (g)',
		'Health Score',
		'Notizen',
	];

	const rows = meals.map((meal) => {
		const date = new Date(meal.timestamp);
		return [
			formatDate(meal.timestamp),
			date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
			getMealTypeLabel(meal.meal_type),
			meal.total_calories ? Math.round(meal.total_calories).toString() : '',
			meal.total_protein ? Math.round(meal.total_protein).toString() : '',
			meal.total_carbs ? Math.round(meal.total_carbs).toString() : '',
			meal.total_fat ? Math.round(meal.total_fat).toString() : '',
			meal.total_fiber ? Math.round(meal.total_fiber).toString() : '',
			meal.total_sugar ? Math.round(meal.total_sugar).toString() : '',
			meal.health_score?.toString() || '',
			meal.user_notes?.replace(/"/g, '""') || '',
		];
	});

	const csvContent = [
		headers.join(';'),
		...rows.map((row) => row.map((cell) => `"${cell}"`).join(';')),
	].join('\n');

	// Add BOM for Excel compatibility with UTF-8
	const BOM = '\uFEFF';
	return new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Export daily summaries to CSV
 */
export function exportSummaryToCSV(summaries: Array<{ date: string; meals: Meal[] }>): Blob {
	const headers = [
		'Datum',
		'Mahlzeiten',
		'Kalorien (kcal)',
		'Protein (g)',
		'Kohlenhydrate (g)',
		'Fett (g)',
		'Durchschn. Health Score',
	];

	const rows = summaries.map(({ date, meals }) => {
		const totalCalories = meals.reduce((sum, m) => sum + (m.total_calories || 0), 0);
		const totalProtein = meals.reduce((sum, m) => sum + (m.total_protein || 0), 0);
		const totalCarbs = meals.reduce((sum, m) => sum + (m.total_carbs || 0), 0);
		const totalFat = meals.reduce((sum, m) => sum + (m.total_fat || 0), 0);
		const healthScores = meals
			.filter((m) => m.health_score !== undefined)
			.map((m) => m.health_score!);
		const avgHealth =
			healthScores.length > 0
				? (healthScores.reduce((a, b) => a + b, 0) / healthScores.length).toFixed(1)
				: '';

		return [
			formatDate(date),
			meals.length.toString(),
			Math.round(totalCalories).toString(),
			Math.round(totalProtein).toString(),
			Math.round(totalCarbs).toString(),
			Math.round(totalFat).toString(),
			avgHealth,
		];
	});

	const csvContent = [
		headers.join(';'),
		...rows.map((row) => row.map((cell) => `"${cell}"`).join(';')),
	].join('\n');

	const BOM = '\uFEFF';
	return new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Export goals to CSV
 */
export function exportGoalsToCSV(goals: NutritionGoal): Blob {
	const content = `Nutriphi Ernährungsziele
Erstellt am: ${formatDate(new Date().toISOString())}

Ziel;Wert
Kalorien (kcal/Tag);${goals.calories_target}
Protein (g/Tag);${goals.protein_target}
Kohlenhydrate (g/Tag);${goals.carbs_target}
Fett (g/Tag);${goals.fat_target}
${goals.fiber_target ? `Ballaststoffe (g/Tag);${goals.fiber_target}` : ''}
${goals.sugar_limit ? `Zucker-Limit (g/Tag);${goals.sugar_limit}` : ''}
`;

	const BOM = '\uFEFF';
	return new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Group meals by date
 */
export function groupMealsByDate(meals: Meal[]): Map<string, Meal[]> {
	const grouped = new Map<string, Meal[]>();

	meals.forEach((meal) => {
		const date = meal.timestamp.split('T')[0];
		const existing = grouped.get(date) || [];
		grouped.set(date, [...existing, meal]);
	});

	return grouped;
}

/**
 * Filter meals by date range
 */
export function filterMealsByDateRange(meals: Meal[], dateFrom: string, dateTo: string): Meal[] {
	const from = new Date(dateFrom);
	const to = new Date(dateTo);
	to.setHours(23, 59, 59, 999);

	return meals.filter((meal) => {
		const mealDate = new Date(meal.timestamp);
		return mealDate >= from && mealDate <= to;
	});
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string): void {
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

/**
 * Generate export filename
 */
export function generateFilename(
	type: 'meals' | 'summary' | 'goals',
	format: 'csv' | 'pdf',
	dateFrom?: string,
	dateTo?: string
): string {
	const date = new Date().toISOString().split('T')[0];
	const range = dateFrom && dateTo ? `_${dateFrom}_${dateTo}` : '';
	return `nutriphi-${type}${range}_${date}.${format}`;
}
