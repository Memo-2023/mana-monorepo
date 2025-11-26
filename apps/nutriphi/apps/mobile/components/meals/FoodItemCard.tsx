import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FoodItem } from '@/types/Database';

interface FoodItemCardProps {
  foodItem: FoodItem;
  categoryColor?: string;
  onPress?: () => void;
  showDetails?: boolean;
}

export const FoodItemCard: React.FC<FoodItemCardProps> = (props) => {
  const {
    foodItem,
    categoryColor = 'border-gray-200 bg-gray-50',
    onPress,
    showDetails = true,
  } = props;
  const formatValue = (value?: number, unit: string = 'g') => {
    if (value === undefined || value === null) return '--';
    return `${Math.round(value)}${unit}`;
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-400';
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceIcon = (confidence?: number) => {
    if (!confidence) return 'help-outline';
    if (confidence >= 0.8) return 'checkmark-circle-outline';
    if (confidence >= 0.6) return 'warning-outline';
    return 'alert-circle-outline';
  };

  const renderNutritionValue = (
    label: string,
    value?: number,
    unit: string = 'g',
    color: string = 'text-gray-700'
  ) => {
    if (value === undefined || value === null) return null;

    return (
      <View className="items-center">
        <Text className={`text-sm font-medium ${color}`}>{formatValue(value, unit)}</Text>
        <Text className="text-xs uppercase tracking-wide text-gray-500">{label}</Text>
      </View>
    );
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      className={`rounded-lg border p-4 ${categoryColor}`}>
      {/* Header */}
      <View className="mb-3 flex-row items-start justify-between">
        <View className="mr-3 flex-1">
          <Text className="mb-1 text-base font-semibold text-gray-900">{foodItem.name}</Text>
          {foodItem.portion_size && (
            <Text className="text-sm text-gray-600">{foodItem.portion_size}</Text>
          )}
        </View>

        {/* Confidence Indicator */}
        {foodItem.confidence && (
          <View className="flex-row items-center">
            <Ionicons
              name={getConfidenceIcon(foodItem.confidence)}
              size={16}
              color={
                getConfidenceColor(foodItem.confidence) === 'text-green-600'
                  ? '#16a34a'
                  : getConfidenceColor(foodItem.confidence) === 'text-yellow-600'
                    ? '#ca8a04'
                    : '#dc2626'
              }
            />
            <Text className={`ml-1 text-xs ${getConfidenceColor(foodItem.confidence)}`}>
              {Math.round(foodItem.confidence * 100)}%
            </Text>
          </View>
        )}
      </View>

      {/* Nutrition Information */}
      {showDetails && (
        <View className="space-y-3">
          {/* Main Calories */}
          {foodItem.calories && (
            <View className="rounded-lg border border-gray-100 bg-white p-3">
              <Text className="text-center text-lg font-bold text-gray-900">
                {formatValue(foodItem.calories, ' kcal')}
              </Text>
              <Text className="text-center text-xs uppercase tracking-wide text-gray-500">
                Kalorien
              </Text>
            </View>
          )}

          {/* Macronutrients */}
          {(foodItem.protein || foodItem.carbs || foodItem.fat) && (
            <View className="flex-row justify-between">
              {renderNutritionValue('Protein', foodItem.protein, 'g', 'text-blue-600')}
              {renderNutritionValue('Kohlenhydrate', foodItem.carbs, 'g', 'text-green-600')}
              {renderNutritionValue('Fett', foodItem.fat, 'g', 'text-orange-600')}
            </View>
          )}

          {/* Additional nutrients */}
          {(foodItem.fiber || foodItem.sugar) && (
            <View className="flex-row justify-between">
              {renderNutritionValue('Ballaststoffe', foodItem.fiber, 'g', 'text-purple-600')}
              {renderNutritionValue('Zucker', foodItem.sugar, 'g', 'text-pink-600')}
              <View /> {/* Spacer for alignment */}
            </View>
          )}

          {/* Food Properties */}
          <View className="flex-row flex-wrap gap-2">
            {Boolean(foodItem.is_organic) && (
              <View className="rounded-full bg-green-100 px-2 py-1">
                <Text className="text-xs font-medium text-green-800">🌱 Bio</Text>
              </View>
            )}
            {Boolean(foodItem.is_processed) && (
              <View className="rounded-full bg-orange-100 px-2 py-1">
                <Text className="text-xs font-medium text-orange-800">📦 Verarbeitet</Text>
              </View>
            )}
          </View>

          {/* Allergens */}
          {foodItem.allergens && (
            <View>
              <Text className="mb-1 text-xs text-gray-600">Allergene:</Text>
              <Text className="text-xs text-red-600">
                {(() => {
                  try {
                    const allergens = JSON.parse(foodItem.allergens);
                    return Array.isArray(allergens) && allergens.length > 0
                      ? allergens.join(', ')
                      : 'Keine';
                  } catch {
                    return 'Keine';
                  }
                })()}
              </Text>
            </View>
          )}
        </View>
      )}
    </CardComponent>
  );
};
