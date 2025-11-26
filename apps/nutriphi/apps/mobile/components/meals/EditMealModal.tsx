import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MealWithItems } from '../../types/Database';
import { useMealStore } from '../../store/MealStore';

interface EditMealModalProps {
  meal: MealWithItems | null;
  visible: boolean;
  onClose: () => void;
}

export const EditMealModal: React.FC<EditMealModalProps> = ({ meal, visible, onClose }) => {
  const { updateMeal } = useMealStore();
  const [notes, setNotes] = useState(meal?.user_notes || '');
  const [rating, setRating] = useState(meal?.user_rating || 0);
  const [location, setLocation] = useState(meal?.location || '');
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (meal) {
      setNotes(meal.user_notes || '');
      setRating(meal.user_rating || 0);
      setLocation(meal.location || '');
    }
  }, [meal]);

  const handleSave = async () => {
    if (!meal) return;

    setIsSaving(true);
    try {
      await updateMeal(meal.id, {
        user_notes: notes.trim() || null,
        user_rating: rating || null,
        location: location.trim() || null,
      });
      onClose();
    } catch (error) {
      console.error('Failed to update meal:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderStars = () => {
    return (
      <View className="flex-row justify-center space-x-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)} className="p-2">
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={32}
              color={star <= rating ? '#fbbf24' : '#d1d5db'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (!meal) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-gray-200 p-4">
          <TouchableOpacity onPress={onClose} className="p-2">
            <Text className="text-base text-blue-600">Abbrechen</Text>
          </TouchableOpacity>
          <Text className="text-lg font-semibold">Mahlzeit bearbeiten</Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving} className="p-2">
            <Text
              className={`text-base font-semibold ${isSaving ? 'text-gray-400' : 'text-blue-600'}`}>
              {isSaving ? 'Speichert...' : 'Fertig'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView className="flex-1 p-4">
          {/* Rating */}
          <View className="mb-6">
            <Text className="mb-3 text-base font-semibold text-gray-900">Bewertung</Text>
            {renderStars()}
            {rating > 0 && (
              <TouchableOpacity onPress={() => setRating(0)} className="mt-2 self-center">
                <Text className="text-sm text-gray-500">Bewertung entfernen</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Location */}
          <View className="mb-6">
            <Text className="mb-2 text-base font-semibold text-gray-900">Ort</Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="z.B. Restaurant, Zuhause, Büro..."
              placeholderTextColor="#9ca3af"
              className="rounded-lg border border-gray-300 p-3 text-base"
              returnKeyType="done"
            />
          </View>

          {/* Notes */}
          <View className="mb-6">
            <Text className="mb-2 text-base font-semibold text-gray-900">Notizen</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Füge Notizen zu dieser Mahlzeit hinzu..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="rounded-lg border border-gray-300 p-3 text-base"
              style={{ minHeight: 100 }}
            />
          </View>

          {/* Meal Info */}
          <View className="rounded-lg bg-gray-50 p-4">
            <Text className="mb-2 text-sm font-medium text-gray-600">Mahlzeit-Info</Text>
            <Text className="text-sm text-gray-600">
              {meal.food_items?.map((item) => item.name).join(', ') || 'Keine Lebensmittel erkannt'}
            </Text>
            {meal.total_calories && (
              <Text className="mt-1 text-sm text-gray-600">
                {Math.round(meal.total_calories)} kcal
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};
