import React, { useState } from 'react';
import { View, ScrollView, Pressable, Modal } from 'react-native';
import Text from '~/components/Text';
import { Icon } from '~/components/Icon';
import { useIsDarkMode } from '~/store/settingsStore';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';

export interface AuthorFilters {
  epochs: string[];
  professions: string[];
  nationalities: string[];
  quoteCount: string[];
  special: string[];
}

interface AuthorFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: AuthorFilters;
  onFiltersChange: (filters: AuthorFilters) => void;
  onClearAll: () => void;
}

const EPOCH_OPTIONS = [
  { key: 'ancient', label: 'Antike', description: 'Vor 500' },
  { key: 'medieval', label: 'Mittelalter', description: '500-1500' },
  { key: 'earlyModern', label: 'Frühe Neuzeit', description: '1500-1800' },
  { key: '19th', label: '19. Jahrhundert', description: '1800-1900' },
  { key: '20th', label: '20. Jahrhundert', description: '1900-2000' },
  { key: '21st', label: '21. Jahrhundert', description: '2000+' },
  { key: 'living', label: 'Noch lebend', description: '' },
];

const PROFESSION_OPTIONS = [
  { key: 'philosopher', label: 'Philosoph' },
  { key: 'writer', label: 'Schriftsteller' },
  { key: 'scientist', label: 'Wissenschaftler' },
  { key: 'politician', label: 'Politiker' },
  { key: 'artist', label: 'Künstler' },
  { key: 'entrepreneur', label: 'Unternehmer' },
  { key: 'poet', label: 'Dichter' },
  { key: 'activist', label: 'Aktivist' },
];

const NATIONALITY_OPTIONS = [
  { key: 'german', label: 'Deutsch' },
  { key: 'american', label: 'Amerikanisch' },
  { key: 'british', label: 'Britisch' },
  { key: 'french', label: 'Französisch' },
  { key: 'italian', label: 'Italienisch' },
  { key: 'spanish', label: 'Spanisch' },
  { key: 'greek', label: 'Griechisch' },
  { key: 'roman', label: 'Römisch' },
];

const QUOTE_COUNT_OPTIONS = [
  { key: 'few', label: 'Wenige', description: '1-5' },
  { key: 'medium', label: 'Mittel', description: '6-15' },
  { key: 'many', label: 'Viele', description: '16-50' },
  { key: 'verymany', label: 'Sehr viele', description: '50+' },
];

const SPECIAL_OPTIONS = [
  { key: 'verified', label: 'Verifiziert' },
  { key: 'featured', label: 'Featured' },
  { key: 'hasImage', label: 'Mit Bild' },
  { key: 'hasBio', label: 'Mit Biografie' },
];

export function AuthorFilterSheet({
  visible,
  onClose,
  filters,
  onFiltersChange,
  onClearAll
}: AuthorFilterSheetProps) {
  const { t } = useTranslation();
  const isDarkMode = useIsDarkMode();

  const toggleFilter = (category: keyof AuthorFilters, value: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const currentFilters = filters[category];
    const newFilters = currentFilters.includes(value)
      ? currentFilters.filter(v => v !== value)
      : [...currentFilters, value];

    onFiltersChange({
      ...filters,
      [category]: newFilters
    });
  };

  const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);

  const renderFilterChip = (
    category: keyof AuthorFilters,
    option: { key: string; label: string; description?: string }
  ) => {
    const isActive = filters[category].includes(option.key);

    return (
      <Pressable
        key={option.key}
        onPress={() => toggleFilter(category, option.key)}
        style={{
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 20,
          backgroundColor: isActive
            ? 'rgba(124, 58, 237, 0.2)'
            : isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          borderWidth: isActive ? 1.5 : 1,
          borderColor: isActive
            ? '#7c3aed'
            : isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          marginRight: 8,
          marginBottom: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {isActive && (
            <Icon
              name="checkmark-circle"
              size={16}
              color="#7c3aed"
              style={{ marginRight: 6 }}
            />
          )}
          <Text
            variant="bodySmall"
            weight={isActive ? 'semibold' : 'medium'}
            style={{ color: isActive ? '#7c3aed' : isDarkMode ? '#fff' : '#000' }}
          >
            {option.label}
          </Text>
          {option.description && (
            <Text
              variant="caption"
              style={{
                color: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                marginLeft: 4
              }}
            >
              {option.description}
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  const renderFilterSection = (
    title: string,
    category: keyof AuthorFilters,
    options: { key: string; label: string; description?: string }[]
  ) => (
    <View style={{ marginBottom: 24 }}>
      <Text
        variant="label"
        weight="semibold"
        color="secondary"
        style={{ marginBottom: 12, marginLeft: 4 }}
      >
        {title}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {options.map(option => renderFilterChip(category, option))}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <Pressable
          style={{ flex: 1 }}
          onPress={onClose}
        />

        <View
          style={{
            maxHeight: '85%',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
            paddingBottom: 0,
          }}
        >
          {/* Drag Handle */}
          <View style={{
            alignItems: 'center',
            paddingTop: 12,
            paddingBottom: 8,
          }}>
            <View style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
            }} />
          </View>

          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          }}>
            <View style={{ flex: 1 }}>
              <Text variant="title" weight="bold" color="primary">
                Filter
              </Text>
              {hasActiveFilters && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onClearAll();
                  }}
                  style={{ marginTop: 4 }}
                >
                  <Text variant="caption" style={{ color: '#ef4444' }}>
                    Alle zurücksetzen
                  </Text>
                </Pressable>
              )}
            </View>

            <Pressable
              onPress={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Icon
                name="close"
                size={20}
                color={isDarkMode ? '#fff' : '#000'}
              />
            </Pressable>
          </View>

          {/* Filter Content */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: 20,
              paddingBottom: 20,
            }}
            showsVerticalScrollIndicator={false}
          >
            {renderFilterSection('Zeitepoche', 'epochs', EPOCH_OPTIONS)}
            {renderFilterSection('Beruf', 'professions', PROFESSION_OPTIONS)}
            {renderFilterSection('Nationalität', 'nationalities', NATIONALITY_OPTIONS)}
            {renderFilterSection('Anzahl Zitate', 'quoteCount', QUOTE_COUNT_OPTIONS)}
            {renderFilterSection('Besondere', 'special', SPECIAL_OPTIONS)}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
