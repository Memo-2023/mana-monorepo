import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { IconButton } from '~/components/common/IconButton';
import Text from '~/components/Text';
import { useIsDarkMode } from '~/store/settingsStore';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  showSettings?: boolean;
  showScrollToggle?: boolean;
  showSortToggle?: boolean;
  sortBy?: 'name' | 'quotes';
  onSortToggle?: () => void;
  rightActions?: React.ReactNode;
  onBackPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  showBackButton = false,
  showSettings = false,
  showScrollToggle = false,
  showSortToggle = false,
  sortBy,
  onSortToggle,
  rightActions,
  onBackPress
}) => {
  const router = useRouter();
  const isDarkMode = useIsDarkMode();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleSettings = () => {
    router.push('/settings');
  };


  return (
    <View className="px-6 py-4">
      <View className="flex-row justify-between items-center">
        <View className="flex-1 flex-row items-center">
          {showBackButton && (
            <IconButton
              icon="arrow-back"
              onPress={handleBack}
              className="mr-3"
            />
          )}
          <View className="flex-1">
            <Text variant="h2" color="primary" weight="bold">
              {title}
            </Text>
            {subtitle && (
              <Text variant="bodySmall" color="secondary" className="mt-1">
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        
        {/* Right Actions */}
        {(rightActions || showSortToggle || showScrollToggle || showSettings) && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {rightActions}
            
            {showSortToggle && (
              <IconButton
                icon={sortBy === 'name' ? 'text-outline' : 'stats-chart-outline'}
                onPress={() => onSortToggle?.()}
                size={20}
              />
            )}
            
            
            {showSettings && (
              <IconButton
                icon="settings-outline"
                onPress={handleSettings}
                size={22}
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
};