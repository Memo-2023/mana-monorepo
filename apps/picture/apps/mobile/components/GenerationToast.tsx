import { useEffect, useState } from 'react';
import { View, Animated, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '~/components/Text';
import { useTheme } from '~/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface GenerationToastProps {
  message: string;
  duration?: number; // ms
  onDismiss?: () => void;
}

export function GenerationToast({ message, duration = 3000, onDismiss }: GenerationToastProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [slideAnim] = useState(new Animated.Value(400)); // Start off-screen (right)

  useEffect(() => {
    // Slide in
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();

    // Auto dismiss after duration
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    // Slide out
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss?.();
    });
  };

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: insets.top + 60, // Below header
        right: 16,
        zIndex: 9999,
        transform: [{ translateX: slideAnim }],
      }}
    >
      <Pressable onPress={handleDismiss}>
        <View
          style={{
            backgroundColor: theme.colors.success,
            borderRadius: 12,
            padding: 12,
            paddingHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            ...theme.shadows.md,
            minWidth: 200,
          }}
        >
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text
            variant="body"
            weight="semibold"
            style={{ color: '#fff', flex: 1 }}
          >
            {message}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
