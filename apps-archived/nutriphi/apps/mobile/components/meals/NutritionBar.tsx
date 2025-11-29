import React from 'react';
import { View, Text } from 'react-native';
import { Meal } from '@/types/Database';

interface NutritionBarProps {
	calories?: number;
	protein?: number;
	carbs?: number;
	fat?: number;
	healthScore?: number;
	compact?: boolean;
	meal?: Meal;
	showDetailed?: boolean;
}

export const NutritionBar: React.FC<NutritionBarProps> = ({
	calories,
	protein,
	carbs,
	fat,
	healthScore,
	compact = false,
	meal,
	showDetailed = false,
}) => {
	// Use meal data if provided, otherwise use individual props
	const mealCalories = meal?.total_calories || calories;
	const mealProtein = meal?.total_protein || protein;
	const mealCarbs = meal?.total_carbs || carbs;
	const mealFat = meal?.total_fat || fat;
	const mealHealthScore = meal?.health_score || healthScore;
	const mealFiber = meal?.total_fiber;
	const mealSugar = meal?.total_sugar;
	const formatValue = (value?: number, unit: string = 'g') => {
		if (value === undefined || value === null) return '--';
		return `${Math.round(value)}${unit}`;
	};

	const getHealthScoreColor = (score?: number) => {
		if (!score) return 'bg-gray-300';
		if (score >= 8) return 'bg-green-500';
		if (score >= 6) return 'bg-yellow-500';
		if (score >= 4) return 'bg-orange-500';
		return 'bg-red-500';
	};

	const getHealthScoreText = (score?: number) => {
		if (!score) return 'Not analyzed';
		if (score >= 8) return 'Very Healthy';
		if (score >= 6) return 'Healthy';
		if (score >= 4) return 'Moderate';
		return 'Unhealthy';
	};

	if (compact) {
		return (
			<View className="flex-row items-center space-x-4">
				<View className="flex-row items-center space-x-1">
					<Text className="text-lg font-bold text-gray-900">
						{formatValue(mealCalories, ' kcal')}
					</Text>
				</View>
				{mealHealthScore && (
					<View className="flex-row items-center space-x-2">
						<View className={`h-3 w-3 rounded-full ${getHealthScoreColor(mealHealthScore)}`} />
						<Text className="text-sm text-gray-600">{mealHealthScore.toFixed(1)}/10</Text>
					</View>
				)}
			</View>
		);
	}

	return (
		<View className="space-y-3">
			{/* Calories Header */}
			<View className="flex-row items-center justify-between">
				<Text className="text-2xl font-bold text-gray-900">
					{formatValue(mealCalories, ' kcal')}
				</Text>
				{mealHealthScore && (
					<View className="flex-row items-center space-x-2">
						<View className={`h-4 w-4 rounded-full ${getHealthScoreColor(mealHealthScore)}`} />
						<View className="items-end">
							<Text className="text-sm font-medium text-gray-900">
								{mealHealthScore.toFixed(1)}/10
							</Text>
							<Text className="text-xs text-gray-500">{getHealthScoreText(mealHealthScore)}</Text>
						</View>
					</View>
				)}
			</View>

			{/* Macronutrients */}
			<View className="flex-row justify-between">
				<View className="items-center">
					<Text className="text-lg font-semibold text-blue-600">{formatValue(mealProtein)}</Text>
					<Text className="text-xs uppercase tracking-wide text-gray-500">Protein</Text>
				</View>

				<View className="items-center">
					<Text className="text-lg font-semibold text-green-600">{formatValue(mealCarbs)}</Text>
					<Text className="text-xs uppercase tracking-wide text-gray-500">Carbs</Text>
				</View>

				<View className="items-center">
					<Text className="text-lg font-semibold text-orange-600">{formatValue(mealFat)}</Text>
					<Text className="text-xs uppercase tracking-wide text-gray-500">Fat</Text>
				</View>
			</View>

			{/* Additional nutrients for detailed view */}
			{showDetailed && (mealFiber || mealSugar) && (
				<View className="flex-row justify-between">
					{mealFiber && (
						<View className="items-center">
							<Text className="text-lg font-semibold text-purple-600">
								{formatValue(mealFiber)}
							</Text>
							<Text className="text-xs uppercase tracking-wide text-gray-500">Fiber</Text>
						</View>
					)}
					{mealSugar && (
						<View className="items-center">
							<Text className="text-lg font-semibold text-pink-600">{formatValue(mealSugar)}</Text>
							<Text className="text-xs uppercase tracking-wide text-gray-500">Sugar</Text>
						</View>
					)}
					<View className="items-center">
						<Text className="text-lg font-semibold text-transparent">--</Text>
						<Text className="text-xs uppercase tracking-wide text-transparent">--</Text>
					</View>
				</View>
			)}

			{/* Visual Progress Bars */}
			<View className="space-y-2">
				<View className="flex-row items-center space-x-3">
					<Text className="w-12 text-xs text-gray-500">PROT</Text>
					<View className="h-2 flex-1 rounded-full bg-gray-200">
						<View
							className="h-2 rounded-full bg-blue-500"
							style={{ width: `${Math.min(((mealProtein || 0) / 50) * 100, 100)}%` }}
						/>
					</View>
					<Text className="w-8 text-xs text-gray-500">{formatValue(mealProtein)}</Text>
				</View>

				<View className="flex-row items-center space-x-3">
					<Text className="w-12 text-xs text-gray-500">CARB</Text>
					<View className="h-2 flex-1 rounded-full bg-gray-200">
						<View
							className="h-2 rounded-full bg-green-500"
							style={{ width: `${Math.min(((mealCarbs || 0) / 100) * 100, 100)}%` }}
						/>
					</View>
					<Text className="w-8 text-xs text-gray-500">{formatValue(mealCarbs)}</Text>
				</View>

				<View className="flex-row items-center space-x-3">
					<Text className="w-12 text-xs text-gray-500">FAT</Text>
					<View className="h-2 flex-1 rounded-full bg-gray-200">
						<View
							className="h-2 rounded-full bg-orange-500"
							style={{ width: `${Math.min(((mealFat || 0) / 30) * 100, 100)}%` }}
						/>
					</View>
					<Text className="w-8 text-xs text-gray-500">{formatValue(mealFat)}</Text>
				</View>

				{/* Additional progress bars for detailed view */}
				{showDetailed && mealFiber && (
					<View className="flex-row items-center space-x-3">
						<Text className="w-12 text-xs text-gray-500">FIBER</Text>
						<View className="h-2 flex-1 rounded-full bg-gray-200">
							<View
								className="h-2 rounded-full bg-purple-500"
								style={{ width: `${Math.min(((mealFiber || 0) / 25) * 100, 100)}%` }}
							/>
						</View>
						<Text className="w-8 text-xs text-gray-500">{formatValue(mealFiber)}</Text>
					</View>
				)}

				{showDetailed && mealSugar && (
					<View className="flex-row items-center space-x-3">
						<Text className="w-12 text-xs text-gray-500">SUGAR</Text>
						<View className="h-2 flex-1 rounded-full bg-gray-200">
							<View
								className="h-2 rounded-full bg-pink-500"
								style={{ width: `${Math.min(((mealSugar || 0) / 50) * 100, 100)}%` }}
							/>
						</View>
						<Text className="w-8 text-xs text-gray-500">{formatValue(mealSugar)}</Text>
					</View>
				)}
			</View>
		</View>
	);
};
