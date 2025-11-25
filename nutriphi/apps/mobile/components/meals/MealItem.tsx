import React from 'react';
import { TouchableOpacity, View, Text, Image } from 'react-native';
import { Meal } from '../../types/Database';
import { Card } from '../ui/Card';
import { NutritionBar } from './NutritionBar';

interface MealItemProps {
  meal: Meal;
  onPress: () => void;
}

export const MealItem: React.FC<MealItemProps> = ({ meal, onPress }) => {
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

  const getAnalysisStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'manual':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAnalysisStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Analyzed';
      case 'pending':
        return 'Processing...';
      case 'failed':
        return 'Failed';
      case 'manual':
        return 'Manual';
      default:
        return 'Unknown';
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card variant="elevated" className="mb-4">
        <View className="flex-row space-x-4">
          {/* Photo */}
          <View className="h-20 w-20 overflow-hidden rounded-lg bg-gray-200">
            {meal.photo_path ? (
              <Image
                source={{ uri: `file://${meal.photo_path}` }}
                className="h-full w-full"
                resizeMode="cover"
              />
            ) : (
              <View className="h-full w-full items-center justify-center">
                <Text className="text-2xl">{getMealTypeIcon(meal.meal_type)}</Text>
              </View>
            )}
          </View>

          {/* Content */}
          <View className="flex-1 space-y-2">
            {/* Header */}
            <View className="flex-row items-start justify-between">
              <View>
                <Text className="text-lg font-semibold capitalize text-gray-900">
                  {meal.meal_type || 'Meal'}
                </Text>
                <Text className="text-sm text-gray-500">{formatTime(meal.timestamp)}</Text>
              </View>

              <View
                className={`rounded-full px-2 py-1 ${getAnalysisStatusColor(meal.analysis_status)}`}>
                <Text className="text-xs font-medium">
                  {getAnalysisStatusText(meal.analysis_status)}
                </Text>
              </View>
            </View>

            {/* Nutrition Summary */}
            {meal.analysis_status === 'completed' && (
              <NutritionBar
                calories={meal.total_calories}
                healthScore={meal.health_score}
                compact={true}
              />
            )}

            {/* Notes */}
            {meal.user_notes && (
              <Text className="text-sm italic text-gray-600" numberOfLines={2}>
                &ldquo;{meal.user_notes}&rdquo;
              </Text>
            )}

            {/* Bottom Info */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center space-x-2">
                {meal.location && <Text className="text-xs text-gray-500">📍 {meal.location}</Text>}
              </View>

              {meal.user_rating && (
                <View className="flex-row">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Text key={i} className="text-xs">
                      {i < meal.user_rating! ? '⭐' : '☆'}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};
