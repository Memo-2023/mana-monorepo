import React, { useState } from 'react';
import { Pressable } from 'react-native';
import { Icon } from '~/components/Icon';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence
} from 'react-native-reanimated';
import { useIsDarkMode } from '~/store/settingsStore';
import usePremiumStore from '~/store/premiumStore';
import { PremiumLimitDialog } from '~/components/PremiumLimitDialog';

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  size?: number;
  variant?: 'default' | 'daily';
  className?: string;
}

export default function FavoriteButton({ 
  isFavorite, 
  onToggle, 
  size = 24, 
  variant = 'default',
  className = ''
}: FavoriteButtonProps) {
  const isDarkMode = useIsDarkMode();
  const scale = useSharedValue(1);
  const heartScale = useSharedValue(1);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  
  const { canAddFavorite, addFavorite, getRemainingFavorites, MAX_DAILY_FAVORITES } = usePremiumStore();

  const handlePress = () => {
    // If removing favorite, always allow
    if (isFavorite) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scale.value = withSpring(1.2, { duration: 150 }, () => {
        scale.value = withSpring(1, { duration: 150 });
      });
      onToggle();
      return;
    }

    // Check if user can add favorite
    if (!canAddFavorite()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setShowLimitDialog(true);
      return;
    }

    // Add favorite with limit tracking
    if (addFavorite()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Animation sequence for adding favorite
      heartScale.value = withSequence(
        withSpring(1.4, { duration: 200 }),
        withSpring(0.8, { duration: 150 }),
        withSpring(1, { duration: 200 })
      );
      
      onToggle();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }]
  }));

  const getColor = () => {
    if (isFavorite) {
      return variant === 'daily' ? '#ff6b6b' : '#ef4444';
    }
    
    if (variant === 'daily') {
      return 'white';
    }
    
    return 'rgba(255,255,255,0.8)';
  };

  return (
    <>
      <Pressable
        onPress={handlePress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        className={variant === 'daily' ? "bg-white/10 p-2 rounded-full" : className}
      >
        <Animated.View style={isFavorite ? heartAnimatedStyle : animatedStyle}>
          <Icon
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={size}
            color={getColor()}
          />
        </Animated.View>
      </Pressable>
      
      <PremiumLimitDialog
        visible={showLimitDialog}
        onClose={() => setShowLimitDialog(false)}
        limitType="favorites"
        remaining={getRemainingFavorites()}
        max={MAX_DAILY_FAVORITES}
      />
    </>
  );
}