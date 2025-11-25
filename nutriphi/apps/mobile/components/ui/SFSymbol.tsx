import React from 'react';
import { Platform } from 'react-native';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from 'nativewind';

interface SFSymbolProps {
  name: string;
  size?: number;
  color?: string;
  weight?: SymbolViewProps['weight'];
  scale?: SymbolViewProps['scale'];
  mode?: SymbolViewProps['mode'];
  fallbackIcon?: React.ComponentProps<typeof FontAwesome>['name'];
  style?: SymbolViewProps['style'];
}

export const SFSymbol: React.FC<SFSymbolProps> = ({
  name,
  size = 24,
  color,
  weight = 'regular',
  scale = 'default',
  mode = 'monochrome',
  fallbackIcon,
  style,
}) => {
  const { colorScheme } = useColorScheme();

  // Use dynamic color if no color specified
  const dynamicColor = color || (colorScheme === 'dark' ? '#ffffff' : '#374151');
  // Use SF Symbols on iOS, fallback to FontAwesome on Android
  if (Platform.OS === 'ios') {
    return (
      <SymbolView
        name={name}
        size={size}
        tintColor={dynamicColor}
        weight={weight}
        scale={scale}
        mode={mode}
        style={style}
      />
    );
  }

  // Android fallback
  if (fallbackIcon) {
    return <FontAwesome name={fallbackIcon} size={size} color={dynamicColor} style={style} />;
  }

  // Default fallback if no fallbackIcon provided
  return <FontAwesome name="question-circle" size={size} color={dynamicColor} style={style} />;
};
