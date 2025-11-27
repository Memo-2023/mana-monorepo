import React from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import Text from '~/components/Text';
import { Icon } from '~/components/Icon';
import { useIsDarkMode } from '~/store/settingsStore';
import * as Haptics from 'expo-haptics';
import { QuoteFilters } from '~/utils/quoteFilters';
import { useTranslation } from 'react-i18next';

interface ActiveQuoteFilterChipsProps {
  filters: QuoteFilters;
  onRemoveFilter: (category: keyof QuoteFilters, value: string) => void;
  onClearAll: () => void;
}

// Label mappings for filter values
const FILTER_LABELS: Record<string, string> = {
  // Time Periods
  ancient: 'Antike',
  medieval: 'Mittelalter',
  earlyModern: 'Frühe Neuzeit',
  '19th': '19. Jh.',
  'early20th': 'Frühes 20. Jh.',
  'late20th': 'Spätes 20. Jh.',
  '21st': '21. Jh.',

  // Source Types
  books: 'Bücher',
  letters: 'Briefe',
  speeches: 'Reden',
  interviews: 'Interviews',
  attributed: 'Zugeschrieben',
  folkWisdom: 'Volksweisheit',
  verified: 'Verifiziert',

  // Categories
  wisdom: 'Weisheit',
  motivation: 'Motivation',
  love: 'Liebe',
  science: 'Wissenschaft',
  philosophy: 'Philosophie',
  humor: 'Humor',
  success: 'Erfolg',
  change: 'Veränderung',
  creativity: 'Kreativität',
  courage: 'Mut',
  happiness: 'Glück',
  life: 'Leben',

  // Special
  featured: 'Featured',
  hasYear: 'Mit Jahr',
  hasSource: 'Mit Quelle',
  long: 'Lang',
  short: 'Kurz',
};

export function ActiveQuoteFilterChips({
  filters,
  onRemoveFilter,
  onClearAll
}: ActiveQuoteFilterChipsProps) {
  const { t } = useTranslation();
  const isDarkMode = useIsDarkMode();

  // Collect all active filters
  const activeFilters: Array<{ category: keyof QuoteFilters; value: string; label: string }> = [];

  Object.entries(filters).forEach(([category, values]) => {
    values.forEach(value => {
      activeFilters.push({
        category: category as keyof QuoteFilters,
        value,
        label: FILTER_LABELS[value] || value
      });
    });
  });

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <View style={{
      paddingHorizontal: 16,
      paddingTop: 110, // Account for header
      paddingBottom: 8,
      backgroundColor: isDarkMode ? '#000' : '#fff',
    }}>
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
        {activeFilters.map((filter, index) => (
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
        {activeFilters.length > 1 && (
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
              {t('common.clearAll')}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
