import React from 'react';
import { View } from 'react-native';
import { Text } from './Text';
import { useThemeStore, useIsDark, useCurrentColors, useRootClassName } from '~/store/themeStore';
import { themes } from '~/themes';

export function ThemeDebug() {
  const { theme, mode } = useThemeStore();
  const isDark = useIsDark();
  const currentColors = useCurrentColors();
  const rootClassName = useRootClassName();

  // Fallback to default theme if currentColors is undefined
  const safeColors = currentColors || themes.default.light;

  return (
    <View className="m-2 rounded-lg border border-border bg-surface p-4">
      <Text className="mb-2 text-lg font-bold text-foreground">Theme Debug</Text>
      <Text className="text-foreground">Theme: {theme}</Text>
      <Text className="text-foreground">Mode: {mode}</Text>
      <Text className="text-foreground">Is Dark: {isDark ? 'true' : 'false'}</Text>
      <Text className="text-foreground">Root Class: {rootClassName}</Text>
      <Text className="text-foreground">Primary Color: {safeColors.primary}</Text>
      <Text className="text-foreground">Colors undefined: {currentColors ? 'no' : 'yes'}</Text>
      <View className="mt-2 rounded bg-primary p-2">
        <Text className="text-primary-foreground">Primary Background Test</Text>
      </View>
      {/* Test with inline styles */}
      <View className="mt-2 rounded p-2" style={{ backgroundColor: `rgb(${safeColors.primary})` }}>
        <Text style={{ color: `rgb(${safeColors.primaryForeground})` }}>Inline Style Test</Text>
      </View>
    </View>
  );
}
