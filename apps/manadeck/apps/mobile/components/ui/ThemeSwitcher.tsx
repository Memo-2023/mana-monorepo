import React from 'react';
import { View, Pressable } from 'react-native';
import { Text } from './Text';
import { Icon } from './Icon';
import { useTheme } from '~/components/ThemeProvider';
import { themeList, themes } from '~/themes';
import { ThemeName, ThemeMode } from '~/types/theme';
import { useThemeColors } from '~/utils/themeUtils';
import { spacing } from '~/utils/spacing';

export function ThemeSwitcher() {
  const { theme, mode, setTheme, setMode } = useTheme();
  const colors = useThemeColors();

  const modeOptions: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'light', label: 'Hell', icon: 'sunny' },
    { value: 'dark', label: 'Dunkel', icon: 'moon' },
    { value: 'system', label: 'System', icon: 'phone-portrait' },
  ];

  return (
    <View style={{ padding: spacing.lg }}>
      {/* Theme Selection */}
      <View style={{ marginBottom: spacing.content.title }}>
        <Text style={{
          fontSize: 14,
          fontWeight: '600',
          color: colors.mutedForeground,
          marginBottom: spacing.content.small,
          textTransform: 'uppercase',
          letterSpacing: 0.5
        }}>
          Farbschema
        </Text>
        <View style={{ gap: spacing.content.small }}>
          {themeList.map((themeItem) => {
            const isSelected = theme === themeItem.name;
            const themeColors = mode === 'dark' || (mode === 'system' && colors.background === 'rgb(3, 7, 18)')
              ? themes[themeItem.name as ThemeName].dark
              : themes[themeItem.name as ThemeName].light;

            return (
              <Pressable
                key={themeItem.name}
                onPress={() => setTheme(themeItem.name as ThemeName)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: spacing.content.small,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: isSelected ? `${colors.primary}10` : colors.surface,
                  opacity: pressed ? 0.7 : 1,
                })}>
                {/* Theme Preview Colors */}
                <View style={{ flexDirection: 'row', gap: 4, marginRight: spacing.content.small }}>
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    backgroundColor: `rgb(${themeColors.primary})`,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }} />
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    backgroundColor: `rgb(${themeColors.accent})`,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }} />
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    backgroundColor: `rgb(${themeColors.surface})`,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }} />
                </View>

                {/* Theme Info */}
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: colors.foreground,
                    marginBottom: 2
                  }}>
                    {themeItem.displayName}
                  </Text>
                  <Text style={{
                    fontSize: 13,
                    color: colors.mutedForeground
                  }}>
                    {themeItem.description}
                  </Text>
                </View>

                {/* Selection Indicator */}
                {isSelected && (
                  <Icon
                    name="checkmark-circle"
                    size={24}
                    color={colors.primary}
                    library="Ionicons"
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Mode Selection */}
      <View>
        <Text style={{
          fontSize: 14,
          fontWeight: '600',
          color: colors.mutedForeground,
          marginBottom: spacing.content.small,
          textTransform: 'uppercase',
          letterSpacing: 0.5
        }}>
          Helligkeit
        </Text>
        <View style={{
          flexDirection: 'row',
          backgroundColor: colors.muted,
          borderRadius: 10,
          padding: 4,
          gap: 4
        }}>
          {modeOptions.map((option) => {
            const isSelected = mode === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setMode(option.value)}
                style={({ pressed }) => ({
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: spacing.content.small,
                  borderRadius: 8,
                  backgroundColor: isSelected ? colors.surface : 'transparent',
                  opacity: pressed ? 0.7 : 1,
                  ...(isSelected && {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2,
                  }),
                })}>
                <Icon
                  name={option.icon}
                  size={18}
                  color={isSelected ? colors.primary : colors.mutedForeground}
                  library="Ionicons"
                  style={{ marginRight: 6 }}
                />
                <Text style={{
                  fontSize: 14,
                  fontWeight: isSelected ? '600' : '400',
                  color: isSelected ? colors.foreground : colors.mutedForeground
                }}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
