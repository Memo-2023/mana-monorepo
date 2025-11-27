import React from 'react';
import { Pressable } from 'react-native';
import { Icon } from '~/components/Icon';
import * as Haptics from 'expo-haptics';
import { useIsDarkMode } from '~/store/settingsStore';

interface IconButtonProps {
  icon: string;
  size?: number;
  onPress: () => void;
  className?: string;
  isActive?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  size = 22,
  onPress,
  className = '',
  isActive = false
}) => {
  const isDarkMode = useIsDarkMode();
  
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };
  
  return (
    <Pressable
      onPress={handlePress}
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center'
      }}
      className={className}
    >
      <Icon 
        name={icon} 
        size={size} 
        color={isDarkMode ? 'white' : 'black'} 
      />
    </Pressable>
  );
};