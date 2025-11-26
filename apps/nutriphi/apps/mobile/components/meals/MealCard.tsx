import React, { useState } from 'react';
import { TouchableOpacity, View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MealWithItems } from '../../types/Database';
import { AnalysisStatusIndicator } from './AnalysisStatusIndicator';

interface MealCardProps {
  meal: MealWithItems;
  onPress: () => void;
}

export const MealCard: React.FC<MealCardProps> = ({ meal, onPress }) => {
  const [imageError, setImageError] = useState(false);
  const generateMealTitle = (meal: MealWithItems): string => {
    if (meal.food_items && meal.food_items.length > 0) {
      const foodNames = meal.food_items.map((item) => item.name);

      if (foodNames.length === 1) {
        return foodNames[0];
      } else if (foodNames.length === 2) {
        return `${foodNames[0]} & ${foodNames[1]}`;
      } else if (foodNames.length > 2) {
        return `${foodNames[0]} & ${foodNames.length - 1} more`;
      }
    }

    // Fallback to meal type if no food items
    const mealTypeLabels = {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
      snack: 'Snack',
    };

    return mealTypeLabels[meal.meal_type || 'snack'] || 'Meal';
  };

  const getMealTypeLabel = (mealType?: string): string => {
    const labels = {
      breakfast: 'Breakfast',
      lunch: 'Lunch',
      dinner: 'Dinner',
      snack: 'Snack',
    };
    return labels[mealType as keyof typeof labels] || 'Meal';
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      return 'Now';
    }
  };

  const getMealTypeIcon = (mealType?: string) => {
    switch (mealType) {
      case 'breakfast':
        return '🥐';
      case 'lunch':
        return '🥗';
      case 'dinner':
        return '🍽️';
      case 'snack':
        return '🍎';
      default:
        return '🍽️';
    }
  };

  const getHealthScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View className="aspect-square overflow-hidden rounded-2xl bg-gray-200 shadow-lg">
        {/* Background Image */}
        {meal.photo_path && !imageError ? (
          <Image
            source={{ uri: meal.photo_path }}
            className="h-full w-full"
            resizeMode="cover"
            onError={(error) => {
              console.error('MealCard image loading error:', error);
              console.log('MealCard photo_path:', meal.photo_path);
              setImageError(true);
            }}
            onLoad={() => {
              console.log('MealCard image loaded successfully:', meal.photo_path);
              setImageError(false);
            }}
          />
        ) : (
          <View className="h-full w-full items-center justify-center bg-gray-300">
            <Text className="text-6xl">{getMealTypeIcon(meal.meal_type)}</Text>
          </View>
        )}

        {/* Blurry Stats Overlay */}
        <View className="absolute bottom-0 left-0 right-0">
          <View className="bg-black/70 px-4 py-3 backdrop-blur-sm">
            <View className="flex-row items-start justify-between">
              {/* Left side - Meal info */}
              <View className="flex-1">
                <Text className="text-lg font-bold text-white" numberOfLines={1}>
                  {generateMealTitle(meal)}
                </Text>
                <View className="flex-row items-center space-x-2">
                  <Text className="text-sm text-gray-300">{getMealTypeLabel(meal.meal_type)}</Text>
                  <Text className="text-sm text-gray-400">•</Text>
                  <Text className="text-sm text-gray-300">{formatTime(meal.timestamp)}</Text>
                </View>
                {/* Location if available */}
                {meal.location && (
                  <View className="mt-1 flex-row items-center">
                    <Ionicons name="location-outline" size={12} color="#d1d5db" />
                    <Text className="ml-1 text-xs text-gray-300" numberOfLines={1}>
                      {meal.location}
                    </Text>
                  </View>
                )}
              </View>

              {/* Right side - Stats */}
              <View className="items-end">
                {meal.analysis_status === 'completed' && (
                  <View className="flex-row items-center space-x-3">
                    {/* Calories */}
                    {meal.total_calories && (
                      <View className="items-center">
                        <Text className="text-xs text-gray-300">cal</Text>
                        <Text className="font-bold text-white">
                          {Math.round(meal.total_calories)}
                        </Text>
                      </View>
                    )}

                    {/* Health Score */}
                    {meal.health_score && (
                      <View className="items-center">
                        <Text className="text-xs text-gray-300">health</Text>
                        <Text className={`font-bold ${getHealthScoreColor(meal.health_score)}`}>
                          {Math.round(meal.health_score)}
                        </Text>
                      </View>
                    )}

                    {/* Rating */}
                    {meal.user_rating && (
                      <View className="items-center">
                        <Text className="text-xs text-gray-300">rating</Text>
                        <Text className="font-bold text-yellow-400">{meal.user_rating}/5</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Analysis Status for non-completed */}
                {meal.analysis_status !== 'completed' && (
                  <View className="rounded-full bg-black/30 p-1">
                    <AnalysisStatusIndicator status={meal.analysis_status} mini={true} />
                  </View>
                )}
              </View>
            </View>

            {/* User Notes */}
            {meal.user_notes && (
              <Text className="mt-2 text-sm italic text-gray-200" numberOfLines={1}>
                &ldquo;{meal.user_notes}&rdquo;
              </Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};
