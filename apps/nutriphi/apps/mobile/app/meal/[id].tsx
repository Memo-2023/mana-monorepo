import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ScrollView, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMealStore } from '@/store/MealStore';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { NutritionBar } from '@/components/meals/NutritionBar';
import { FoodItemList } from '@/components/meals/FoodItemList';
import { AnalysisStatusIndicator } from '@/components/meals/AnalysisStatusIndicator';

export default function MealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedMeal, loadMealById, isLoading } = useMealStore();
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (id) {
      loadMealById(parseInt(id));
      setImageError(false); // Reset image error state when loading new meal
    }
  }, [id, loadMealById]);

  // Poll for updates if analysis is pending
  useEffect(() => {
    if (!selectedMeal || selectedMeal.analysis_status !== 'pending') {
      return;
    }

    // Poll every 2 seconds
    const interval = setInterval(() => {
      loadMealById(selectedMeal.id);
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedMeal?.id, selectedMeal?.analysis_status, loadMealById]);

  // Add debug logging when component renders
  useEffect(() => {
    console.log(
      'Meal detail component rendered with selectedMeal:',
      selectedMeal?.id,
      'photo_path:',
      selectedMeal?.photo_path
    );
  }, [selectedMeal]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <LoadingSpinner />
      </View>
    );
  }

  if (!selectedMeal) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg text-gray-500">Mahlzeit nicht gefunden</Text>
      </View>
    );
  }

  const generateMealTitle = (meal: any): string => {
    if (meal.food_items && meal.food_items.length > 0) {
      const foodNames = meal.food_items.map((item: any) => item.name);

      if (foodNames.length === 1) {
        return foodNames[0];
      } else if (foodNames.length === 2) {
        return `${foodNames[0]} & ${foodNames[1]}`;
      } else if (foodNames.length > 2) {
        return `${foodNames[0]} & ${foodNames.length - 1} weitere`;
      }
    }

    // Fallback to meal type if no food items
    return getMealTypeLabel(meal.meal_type);
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMealTypeIcon = (mealType?: string) => {
    switch (mealType) {
      case 'breakfast':
        return 'sunny-outline';
      case 'lunch':
        return 'restaurant-outline';
      case 'dinner':
        return 'moon-outline';
      case 'snack':
        return 'cafe-outline';
      default:
        return 'restaurant-outline';
    }
  };

  const getMealTypeLabel = (mealType?: string) => {
    switch (mealType) {
      case 'breakfast':
        return 'Frühstück';
      case 'lunch':
        return 'Mittagessen';
      case 'dinner':
        return 'Abendessen';
      case 'snack':
        return 'Snack';
      default:
        return 'Mahlzeit';
    }
  };

  const renderStars = (rating?: number) => {
    if (!rating) return null;

    return (
      <View className="flex-row">
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={20}
            color={star <= rating ? '#fbbf24' : '#d1d5db'}
          />
        ))}
      </View>
    );
  };

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header */}
      <View className="relative">
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute left-4 top-12 z-10 rounded-full bg-black/50 p-2">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        {/* Photo */}
        <View className="h-80 bg-gray-200">
          {selectedMeal.photo_path && !imageError ? (
            <Image
              source={{ uri: selectedMeal.photo_path }}
              className="h-full w-full"
              resizeMode="cover"
              onError={(error) => {
                console.error('Detail page image loading error:', error);
                console.log('Detail page photo_path:', selectedMeal.photo_path);
                setImageError(true);
              }}
              onLoad={() => {
                console.log('Detail page image loaded successfully:', selectedMeal.photo_path);
              }}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Ionicons name={getMealTypeIcon(selectedMeal.meal_type)} size={64} color="#9ca3af" />
              <Text className="mt-2 text-sm text-gray-500">
                {imageError ? 'Foto konnte nicht geladen werden' : 'Kein Foto verfügbar'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      <View className="p-4">
        {/* Meal Title and Rating */}
        <View className="mb-2 flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900" numberOfLines={2}>
              {generateMealTitle(selectedMeal)}
            </Text>
          </View>
          {selectedMeal.user_rating && (
            <View className="ml-4">{renderStars(selectedMeal.user_rating)}</View>
          )}
        </View>

        {/* Meal Type and Date */}
        <View className="mb-6 flex-row items-center">
          <Ionicons
            name={getMealTypeIcon(selectedMeal.meal_type)}
            size={20}
            color="#6b7280"
            style={{ marginRight: 6 }}
          />
          <Text className="text-base text-gray-600">
            {getMealTypeLabel(selectedMeal.meal_type)}
          </Text>
          <Text className="mx-2 text-gray-400">•</Text>
          <Text className="text-base text-gray-600">{formatDate(selectedMeal.timestamp)}</Text>
        </View>

        {/* Location */}
        {selectedMeal.location && (
          <View className="mb-6 flex-row items-center">
            <Ionicons name="location-outline" size={20} color="#6b7280" />
            <Text className="ml-2 text-gray-600">{selectedMeal.location}</Text>
          </View>
        )}

        {/* Nutrition Overview */}
        {selectedMeal.analysis_status === 'completed' && (
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-gray-900">Nährwerte</Text>
            <NutritionBar meal={selectedMeal} showDetailed={true} />
          </View>
        )}

        {/* Analysis Status */}
        <View className="mb-6">
          <AnalysisStatusIndicator status={selectedMeal.analysis_status} />
        </View>

        {/* Food Items */}
        {selectedMeal.food_items && selectedMeal.food_items.length > 0 && (
          <View className="mb-6">
            <FoodItemList foodItems={selectedMeal.food_items} />
          </View>
        )}

        {/* User Notes */}
        {selectedMeal.user_notes && (
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-gray-900">Notizen</Text>
            <View className="rounded-lg bg-blue-50 p-3">
              <Text className="text-gray-700">{selectedMeal.user_notes}</Text>
            </View>
          </View>
        )}

        {/* Analysis Confidence */}
        {selectedMeal.analysis_confidence && (
          <View className="mb-6">
            <Text className="text-sm text-gray-600">
              Analyse-Sicherheit: {Math.round(selectedMeal.analysis_confidence * 100)}%
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
