import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import Text from '~/components/atoms/Text';
import { useTheme } from '~/features/theme/ThemeProvider';
import Icon from '~/components/atoms/Icon';
import Toggle from '~/components/atoms/Toggle';
import colors from '~/tailwind.config.js';

interface SettingsToggleProps {
  title: string;
  description: string;
  type: 'toggle' | 'dropdown' | 'button';
  isOn?: boolean;
  onToggle?: (value: boolean) => void;
  options?: string[];
  selectedOption?: string;
  onSelect?: (option: string) => void;
  onPress?: () => void;
  secondaryText?: string;
}

function SettingsToggle({
  title,
  description,
  type,
  isOn = false,
  onToggle = undefined,
  options = undefined,
  selectedOption = '',
  onSelect = undefined,
  onPress = undefined,
  secondaryText = undefined,
}: SettingsToggleProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { isDark, themeVariant, tw } = useTheme();

  const handlePress = () => {
    if (type === 'toggle' && onToggle) {
      onToggle(!isOn);
    } else if (type === 'dropdown') {
      setIsDropdownOpen(!isDropdownOpen);
    } else if (type === 'button' && onPress) {
      onPress();
    }
  };

  const handleSelect = (option: string) => {
    if (onSelect) {
      onSelect(option);
    }
    setIsDropdownOpen(false);
  };

  // Farben aus dem Theme-System
  const textColor = isDark ? '#FFFFFF' : '#000000';
  
  // Zugriff auf die Theme-Farben für die Dropdown-Optionen
  const themeColors = (colors as any).theme?.extend?.colors;
  
  // Primary-Farbe direkt aus der Tailwind-Konfiguration
  const primaryColor = isDark 
    ? themeColors?.dark?.[themeVariant]?.primary || '#f8d62b'
    : themeColors?.[themeVariant]?.primary || '#f8d62b';

  // Hintergrundfarbe für den Container aus der Tailwind-Konfiguration
  const containerBgColor = isDark
    ? themeColors?.dark?.[themeVariant]?.contentBackground || '#1E1E1E'
    : themeColors?.[themeVariant]?.contentBackground || '#FFFFFF';
    
  // Randfarbe für den Container aus der Tailwind-Konfiguration
  const containerBorderColor = isDark
    ? themeColors?.dark?.[themeVariant]?.border || '#424242'
    : themeColors?.[themeVariant]?.border || '#e6e6e6';
  
  return (
    <Pressable 
      onPress={handlePress}
      style={{
        backgroundColor: containerBgColor,
        borderColor: containerBorderColor,
        borderWidth: 1,
        borderRadius: 16,
        overflow: 'hidden',
      }}
      className={`${isDark ? 'active:bg-gray-800/50' : 'active:bg-gray-200/50'}`}
    >
      <View className="px-4 py-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className={`text-base font-semibold flex-1 mr-2 ${isDark ? 'text-white' : 'text-black'}`}>
            {title}
          </Text>
          {type === 'toggle' && onToggle && (
            <Toggle 
              isOn={isOn} 
              onToggle={onToggle} 
              size="medium" 
            />
          )}
          {type === 'dropdown' && options && onSelect && (
            <Icon 
              name={isDropdownOpen ? "chevron-up-outline" : "chevron-down-outline"} 
              size={20} 
              color={textColor} 
            />
          )}
          {type === 'button' && onPress && (
            <View className="flex-row items-center">
              {secondaryText && (
                <Text 
                  className={`mr-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                  numberOfLines={1}
                >
                  {secondaryText}
                </Text>
              )}
              <Icon 
                name="chevron-forward-outline" 
                size={20} 
                color={textColor} 
              />
            </View>
          )}
        </View>
        <Text 
          className={`text-sm ${isDark ? 'text-white/70' : 'text-black/70'}`}
          style={{ lineHeight: 26 }}
        >
          {description}
        </Text>
        {type === 'dropdown' && isDropdownOpen && options && onSelect && (
          <View className="mt-2">
            {options.map((option) => {
              const isSelected = option === selectedOption;
              return (
                <Pressable
                  key={option}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    marginVertical: 2,
                    backgroundColor: isSelected ? primaryColor : 'transparent',
                  }}
                  className="active:opacity-70"
                  onPress={() => handleSelect(option)}
                >
                  <Text className={`${isSelected ? 'text-white font-bold' : isDark ? 'text-white' : 'text-black'}`}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default SettingsToggle;
