import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { FoodItem } from '@/types/Database';
import { FoodItemCard } from './FoodItemCard';

interface FoodItemListProps {
  foodItems: FoodItem[];
  title?: string;
  showTitle?: boolean;
}

export const FoodItemList: React.FC<FoodItemListProps> = ({
  foodItems,
  title = 'Erkannte Lebensmittel',
  showTitle = true,
}) => {
  if (!foodItems || foodItems.length === 0) {
    return (
      <View className="py-4">
        {showTitle && <Text className="mb-3 text-lg font-semibold text-gray-900">{title}</Text>}
        <View className="items-center rounded-lg bg-gray-50 p-6">
          <Text className="mb-2 text-4xl">🍽️</Text>
          <Text className="text-center text-gray-600">Keine Lebensmittel erkannt</Text>
        </View>
      </View>
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'protein':
        return '🥩';
      case 'vegetable':
        return '🥕';
      case 'grain':
        return '🌾';
      case 'fruit':
        return '🍎';
      case 'dairy':
        return '🥛';
      case 'fat':
        return '🥑';
      case 'processed':
        return '📦';
      case 'beverage':
        return '🥤';
      default:
        return '🍽️';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'protein':
        return 'border-red-200 bg-red-50';
      case 'vegetable':
        return 'border-green-200 bg-green-50';
      case 'grain':
        return 'border-yellow-200 bg-yellow-50';
      case 'fruit':
        return 'border-orange-200 bg-orange-50';
      case 'dairy':
        return 'border-blue-200 bg-blue-50';
      case 'fat':
        return 'border-purple-200 bg-purple-50';
      case 'processed':
        return 'border-gray-200 bg-gray-50';
      case 'beverage':
        return 'border-cyan-200 bg-cyan-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  // Group food items by category
  const groupedByCategory = foodItems.reduce(
    (acc, item) => {
      const category = item.category || 'other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, FoodItem[]>
  );

  const categoryOrder = [
    'protein',
    'vegetable',
    'grain',
    'fruit',
    'dairy',
    'fat',
    'beverage',
    'processed',
    'other',
  ];
  const sortedCategories = categoryOrder.filter((category) => groupedByCategory[category]);
  const otherCategories = Object.keys(groupedByCategory).filter(
    (category) => !categoryOrder.includes(category)
  );
  const allCategories = [...sortedCategories, ...otherCategories];

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'protein':
        return 'Proteine';
      case 'vegetable':
        return 'Gemüse';
      case 'grain':
        return 'Getreide';
      case 'fruit':
        return 'Obst';
      case 'dairy':
        return 'Milchprodukte';
      case 'fat':
        return 'Fette';
      case 'processed':
        return 'Verarbeitete Lebensmittel';
      case 'beverage':
        return 'Getränke';
      default:
        return 'Sonstige';
    }
  };

  return (
    <View className="py-4">
      {showTitle && (
        <Text className="mb-4 text-lg font-semibold text-gray-900">
          {title} ({foodItems.length})
        </Text>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {allCategories.map((category) => (
          <View key={category} className="mb-6">
            {/* Category Header */}
            <View className="mb-3 flex-row items-center">
              <Text className="mr-2 text-2xl">{getCategoryIcon(category)}</Text>
              <Text className="text-base font-medium text-gray-800">
                {getCategoryName(category)} ({groupedByCategory[category].length})
              </Text>
            </View>

            {/* Category Items */}
            <View className="space-y-2">
              {groupedByCategory[category].map((item, index) => (
                <FoodItemCard
                  key={item.id || `${category}-${index}`}
                  foodItem={item}
                  categoryColor={getCategoryColor(category)}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};
