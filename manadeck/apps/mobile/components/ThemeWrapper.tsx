import React, { useEffect, useState } from 'react';
import { View, Platform } from 'react-native';
import { useRootClassName } from '~/store/themeStore';

interface ThemeWrapperProps {
  children: React.ReactNode;
}

export function ThemeWrapper({ children }: ThemeWrapperProps) {
  const rootClassName = useRootClassName();
  const [themeKey, setThemeKey] = useState(0);

  useEffect(() => {
    // For web, apply classes to document element
    if (Platform.OS === 'web') {
      const html = document.documentElement;
      // Clear all existing theme classes
      html.classList.remove('theme-default', 'theme-forest', 'theme-sunset', 'dark');

      // Apply new theme classes
      if (rootClassName) {
        const classes = rootClassName.split(' ').filter(Boolean);
        classes.forEach((cls) => html.classList.add(cls));
      }
    }

    // Force re-render to apply new CSS variables
    setThemeKey((prev) => prev + 1);

    // Force Metro/NativeWind to re-process styles
    if (Platform.OS !== 'web') {
      // Trigger a small delay to ensure styles are applied
      setTimeout(() => {
        setThemeKey((prev) => prev + 1);
      }, 50);
    }
  }, [rootClassName]);

  // For React Native, we need to set the theme class on a wrapper View
  // The CSS variables will be applied via the global CSS
  // Using key prop to force re-render when theme changes
  return (
    <View key={themeKey} className={`flex-1 ${rootClassName}`} style={{ flex: 1 }}>
      {children}
    </View>
  );
}
