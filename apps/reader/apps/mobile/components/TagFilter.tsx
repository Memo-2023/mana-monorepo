import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useTexts } from '~/hooks/useTexts';
import { useStore } from '~/store/store';
import { useTheme } from '~/hooks/useTheme';

export const TagFilter: React.FC = () => {
  const { getAllTags } = useTexts();
  const { selectedTags, toggleTag, clearTags } = useStore();
  const { colors } = useTheme();

  const allTags = getAllTags();

  if (allTags.length === 0) {
    return null;
  }

  return (
    <View className={`border-b ${colors.border} ${colors.surface} px-4 py-2`}>
      <View className="mb-2 flex-row items-center justify-between">
        <Text className={`text-sm font-medium ${colors.textSecondary}`}>Tags filtern:</Text>
        {selectedTags.length > 0 && (
          <Pressable onPress={clearTags}>
            <Text className="text-sm text-blue-600">Alle entfernen</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 16 }}>
        {allTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <Pressable
              key={tag}
              onPress={() => toggleTag(tag)}
              className={`mr-2 rounded-full border px-3 py-1 ${
                isSelected
                  ? `border-blue-500 ${colors.primaryLight}`
                  : `${colors.borderSecondary} ${colors.surfaceSecondary}`
              }`}>
              <Text className={`text-sm ${isSelected ? 'text-blue-800' : colors.textSecondary}`}>
                {tag}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};
