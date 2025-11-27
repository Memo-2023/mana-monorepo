import React from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import Text from '~/components/Text';
import { Icon } from '~/components/Icon';
import { useIsDarkMode } from '~/store/settingsStore';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { AuthorFilters } from './AuthorFilterSheet';

interface ActiveFilterChipsProps {
  filters: AuthorFilters;
  onRemoveFilter: (category: keyof AuthorFilters, value: string) => void;
  onClearAll: () => void;
}

const FILTER_LABELS: Record<string, string> = {
  // Epochs
  ancient: 'Antike',
  medieval: 'Mittelalter',
  earlyModern: 'Frühe Neuzeit',
  '19th': '19. Jhd.',
  '20th': '20. Jhd.',
  '21st': '21. Jhd.',
  living: 'Lebend',

  // Professions
  philosopher: 'Philosoph',
  writer: 'Schriftsteller',
  scientist: 'Wissenschaftler',
  politician: 'Politiker',
  artist: 'Künstler',
  entrepreneur: 'Unternehmer',
  poet: 'Dichter',
  activist: 'Aktivist',

  // Nationalities
  german: 'Deutsch',
  american: 'Amerikanisch',
  british: 'Britisch',
  french: 'Französisch',
  italian: 'Italienisch',
  spanish: 'Spanisch',
  greek: 'Griechisch',
  roman: 'Römisch',

  // Quote counts
  few: '1-5 Zitate',
  medium: '6-15 Zitate',
  many: '16-50 Zitate',
  verymany: '50+ Zitate',

  // Special
  verified: 'Verifiziert',
  featured: 'Featured',
  hasImage: 'Mit Bild',
  hasBio: 'Mit Bio',
};

export function ActiveFilterChips({
  filters,
  onRemoveFilter,
  onClearAll
}: ActiveFilterChipsProps) {
  const isDarkMode = useIsDarkMode();

  const allActiveFilters: { category: keyof AuthorFilters; value: string; label: string }[] = [];

  // Collect all active filters
  (Object.keys(filters) as Array<keyof AuthorFilters>).forEach(category => {
    filters[category].forEach(value => {
      allActiveFilters.push({
        category,
        value,
        label: FILTER_LABELS[value] || value
      });
    });
  });

  if (allActiveFilters.length === 0) return null;

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={{
        paddingHorizontal: 16,
        paddingTop: 110, // Account for header
        paddingBottom: 8,
        backgroundColor: isDarkMode ? '#000' : '#fff',
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {/* Active filter chips */}
        {allActiveFilters.map((filter, index) => (
          <Pressable
            key={`${filter.category}-${filter.value}-${index}`}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onRemoveFilter(filter.category, filter.value);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingLeft: 12,
              paddingRight: 8,
              paddingVertical: 6,
              borderRadius: 16,
              backgroundColor: 'rgba(124, 58, 237, 0.15)',
              borderWidth: 1,
              borderColor: 'rgba(124, 58, 237, 0.3)',
            }}
          >
            <Text
              variant="caption"
              weight="medium"
              style={{ color: '#7c3aed', marginRight: 4 }}
            >
              {filter.label}
            </Text>
            <Icon
              name="close-circle"
              size={16}
              color="#7c3aed"
            />
          </Pressable>
        ))}

        {/* Clear all button */}
        {allActiveFilters.length > 1 && (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onClearAll();
            }}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
              backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
              borderWidth: 1,
              borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)',
            }}
          >
            <Text
              variant="caption"
              weight="semibold"
              style={{ color: '#ef4444' }}
            >
              Alle löschen
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </Animated.View>
  );
}
