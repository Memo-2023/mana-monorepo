import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Text from '~/components/atoms/Text';
import { useTheme, ColorMode, ThemeVariant } from './ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import colors from '~/tailwind.config.js';
import { useTranslation } from 'react-i18next';

// Vorschaufarben für jedes Theme
const THEME_PREVIEW_COLORS: Record<ThemeVariant, { primary: string; secondary: string }> = {
  lume: { primary: '#f8d62b', secondary: '#383838' },
  nature: { primary: '#81C784', secondary: '#2E7D32' },
  stone: { primary: '#90A4AE', secondary: '#455A64' },
  ocean: { primary: '#4FC3F7', secondary: '#0277BD' },
};

/**
 * Theme-Einstellungen-Komponente
 * Ermöglicht die Auswahl von Farbmodus und Theme-Variante
 */
export const ThemeSettings = () => {
  const { t } = useTranslation();
  const { 
    isDark,
    colorMode,
    setColorMode,
    themeVariant,
    setThemeVariant,
    tw,
    themeVersion
  } = useTheme();

  // Farbmodus-Optionen mit Übersetzungen
  const COLOR_MODES: { label: string; value: ColorMode; icon: string }[] = [
    { label: t('settings.system', 'System'), value: 'system', icon: 'sync' },
    { label: t('settings.light', 'Hell'), value: 'light', icon: 'sunny' },
    { label: t('settings.dark', 'Dunkel'), value: 'dark', icon: 'moon' },
  ];

  // Verwende die gleichen Farben wie MemoPreview und SettingsToggle
  const themeColors = (colors as any).theme?.extend?.colors;
  const cardBackgroundColor = isDark
    ? themeColors?.dark?.[themeVariant]?.contentBackground || '#1E1E1E'
    : themeColors?.[themeVariant]?.contentBackground || '#FFFFFF';
  const borderColor = isDark
    ? themeColors?.dark?.[themeVariant]?.border || '#424242'
    : themeColors?.[themeVariant]?.border || '#e6e6e6';

  // Primary-Farbe für aktive Tabs
  const primaryColor = isDark
    ? themeColors?.dark?.[themeVariant]?.primary || '#f8d62b'
    : themeColors?.[themeVariant]?.primary || '#f8d62b';

  return (
    <View className="w-full space-y-2">
      {/* Farbmodus-Einstellungen */}
      <View style={{ backgroundColor: cardBackgroundColor, borderColor, borderWidth: 1, padding: 16, borderRadius: 16 }}>
        <Text variant="h2" style={{ marginBottom: 16 }}>
          {t('settings.appearance', 'Erscheinungsbild')}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          {COLOR_MODES.map(mode => {
            const isSelected = mode.value === colorMode;
            return (
              <TouchableOpacity
                key={mode.value}
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  paddingHorizontal: 8,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  borderWidth: isSelected ? 2 : 1,
                  borderColor: isSelected
                    ? primaryColor
                    : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                }}
                onPress={() => setColorMode(mode.value)}
              >
                <Ionicons
                  name={mode.icon as any}
                  size={24}
                  color={isSelected ? primaryColor : (isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)')}
                />
                <Text
                  variant='body'
                  style={{
                    color: isSelected ? primaryColor : (isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'),
                    fontWeight: isSelected ? '600' : '500',
                    marginTop: 8,
                    fontSize: 12,
                  }}
                >
                  {mode.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Theme-Varianten */}
      {/* <View style={{ backgroundColor: cardBackgroundColor, borderColor, borderWidth: 1, marginTop: 16, padding: 16, borderRadius: 12 }}>
        <Text variant="h2" style={{ marginBottom: 16 }}>
          {t('settings.theme', 'Theme')}
        </Text>
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            {Object.entries(THEME_NAMES).slice(0, 2).map(([value, label]) => {
              const colors = THEME_PREVIEW_COLORS[value as ThemeVariant];
              const isSelected = value === themeVariant;
              return (
                <TouchableOpacity
                  key={value}
                  style={{
                    flex: 1,
                    padding: 8,
                    borderRadius: 12,
                    alignItems: 'center',
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: colors.primary,
                  }}
                  onPress={() => setThemeVariant(value as ThemeVariant)}
                >
                  <View 
                    style={{
                      width: '100%',
                      height: 80,
                      borderRadius: 8,
                      overflow: 'hidden',
                      position: 'relative',
                      marginBottom: 8,
                    }}
                  >
                    <View 
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: colors.primary,
                      }}
                    />
                    <View 
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        width: '60%',
                        height: '100%',
                        backgroundColor: colors.secondary,
                      }}
                    />

                  </View>
                  <Text
                    variant="body"
                    style={{ 
                      fontWeight: isSelected ? 'bold' : '500',
                      color: isDark ? '#FFFFFF' : '#000000'
                    }}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            {Object.entries(THEME_NAMES).slice(2, 4).map(([value, label]) => {
              const colors = THEME_PREVIEW_COLORS[value as ThemeVariant];
              const isSelected = value === themeVariant;
              return (
                <TouchableOpacity
                  key={value}
                  style={{
                    flex: 1,
                    padding: 8,
                    borderRadius: 12,
                    alignItems: 'center',
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: colors.primary,
                  }}
                  onPress={() => setThemeVariant(value as ThemeVariant)}
                >
                  <View 
                    style={{
                      width: '100%',
                      height: 80,
                      borderRadius: 8,
                      overflow: 'hidden',
                      position: 'relative',
                      marginBottom: 8,
                    }}
                  >
                    <View 
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: colors.primary,
                      }}
                    />
                    <View 
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        width: '60%',
                        height: '100%',
                        backgroundColor: colors.secondary,
                      }}
                    />

                  </View>
                  <Text
                    variant="body"
                    style={{ 
                      fontWeight: isSelected ? 'bold' : '500',
                      color: isDark ? '#FFFFFF' : '#000000'
                    }}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View> */}
    </View>
  );
};
