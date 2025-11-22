import React, { useRef } from 'react';
import { StyleSheet, Pressable, Share, Platform, Animated } from 'react-native';
import Toast from 'react-native-toast-message';
import Icon from '../atoms/Icon';

// Conditionally import Clipboard to avoid errors in development
let Clipboard: any;
try {
  Clipboard = require('expo-clipboard');
} catch (e) {
  console.log('expo-clipboard not available, using fallback');
}

interface ShareButtonProps {
  storyId: string;
  storyTitle: string;
  storyDescription?: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  storyId,
  storyTitle,
  storyDescription,
  size = 'medium',
  color = '#FFFFFF'
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const sizeConfig = {
    small: { icon: 20, padding: 8 },
    medium: { icon: 24, padding: 10 },
    large: { icon: 32, padding: 12 }
  };

  const config = sizeConfig[size];

  const generateShareUrl = () => {
    // In production, this would be your actual domain
    const baseUrl = 'https://maerchenzauber.app';
    return `${baseUrl}/story/${storyId}`;
  };

  const generateShareMessage = () => {
    const url = generateShareUrl();
    const message = storyDescription 
      ? `📚 "${storyTitle}"\n\n${storyDescription}\n\nLies die ganze Geschichte:\n${url}`
      : `📚 Schau dir diese tolle Geschichte an: "${storyTitle}"\n\n${url}`;
    
    return message;
  };

  const handleShare = async () => {
    // Animate button press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      }),
    ]).start();

    const message = generateShareMessage();

    try {
      if (Platform.OS === 'web' && Clipboard) {
        // For web, use clipboard and show toast
        await Clipboard.setStringAsync(message);
        Toast.show({
          type: 'success',
          text1: 'Link kopiert!',
          text2: 'Der Story-Link wurde in die Zwischenablage kopiert',
          position: 'bottom',
          visibilityTime: 3000,
        });
      } else {
        // For mobile and web without clipboard, use native share sheet
        const result = await Share.share({
          message,
          title: storyTitle,
        });

        if (result.action === Share.sharedAction) {
          // Story was shared successfully
          Toast.show({
            type: 'success',
            text1: 'Geschichte geteilt!',
            position: 'bottom',
            visibilityTime: 2000,
          });
        }
      }
    } catch (error) {
      console.error('Error sharing story:', error);
      Toast.show({
        type: 'error',
        text1: 'Fehler beim Teilen',
        text2: 'Die Geschichte konnte nicht geteilt werden',
        position: 'bottom',
        visibilityTime: 3000,
      });
    }
  };

  return (
    <Pressable
      onPress={handleShare}
      style={({ pressed }) => [
        styles.button,
        { padding: config.padding },
        pressed && styles.buttonPressed,
      ]}
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }]
        }}
      >
        <Icon
          set="ionicons"
          name="share-social-outline"
          size={config.icon}
          color={color}
        />
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
});

export default ShareButton;