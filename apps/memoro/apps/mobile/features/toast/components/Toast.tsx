import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Animated, Easing } from 'react-native';
import { Toast as ToastType } from '../types';
import Text from '~/components/atoms/Text';
import Button from '~/components/atoms/Button';
import { useTheme } from '~/features/theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
  onAction?: () => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onDismiss, onAction }) => {
  // Early return if toast is invalid
  if (!toast || typeof toast !== 'object') {
    return null;
  }

  const { tw, isDark, themeVariant, colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Progress animation for loading toasts
  useEffect(() => {
    if (toast.type === 'loading' && toast.metadata && typeof toast.metadata === 'object' && toast.metadata.progress !== undefined) {
      Animated.timing(progressAnim, {
        toValue: toast.metadata.progress / 100,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [toast.metadata?.progress]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(toast.id);
    });
  };

  const getToastColors = () => {
    const baseColors = {
      success: { bg: '#10B981', border: '#059669', icon: 'checkmark-circle' },
      error: { bg: '#EF4444', border: '#DC2626', icon: 'close-circle' },
      warning: { bg: '#F59E0B', border: '#D97706', icon: 'warning' },
      info: { bg: '#3B82F6', border: '#2563EB', icon: 'information-circle' },
      loading: { bg: '#6B7280', border: '#4B5563', icon: 'refresh' },
    };

    return baseColors[toast.type];
  };

  const toastColors = getToastColors();
  const iconName = toastColors.icon as keyof typeof Ionicons.glyphMap;

  return (
    <Animated.View
      style={[
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
        tw('mx-4 mb-2 rounded-lg'),
        {
          backgroundColor: colors.contentBackgroundHover,
          borderLeftWidth: 4,
          borderLeftColor: toastColors.bg,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: isDark ? 0.6 : 0.4,
          shadowRadius: 32,
          elevation: 20,
        },
      ]}
    >
      <View style={tw('p-4')}>
        <View style={tw('flex-row items-start')}>
          {/* Icon */}
          <View
            style={[
              tw('w-8 h-8 rounded-full items-center justify-center mr-3 mt-0.5'),
              { backgroundColor: toastColors.bg },
            ]}
          >
            <Ionicons
              name={iconName}
              size={18}
              color="white"
              style={toast.type === 'loading' ? {
                transform: [{ rotate: '0deg' }],
              } : {}}
            />
          </View>

          {/* Content */}
          <View style={tw('flex-1')}>
            <Text
              style={[
                tw('font-semibold text-base'),
                { color: colors.text },
              ]}
            >
              {toast.title}
            </Text>
            
            {toast.message && (
              <Text
                style={[
                  tw('text-sm mt-1'),
                  { color: `${colors.text}CC` }, // 80% opacity
                ]}
              >
                {toast.message}
              </Text>
            )}

            {/* Mana count display */}
            {toast.metadata && typeof toast.metadata === 'object' && toast.metadata.manaCount !== undefined && (
              <View style={tw('flex-row items-center mt-2')}>
                <Icon
                  source={require('~/assets/icons/mana-icon.svg')}
                  size={16}
                  style={tw('mr-1')}
                />
                <Text
                  style={[
                    tw('text-sm font-medium'),
                    { color: toastColors.bg },
                  ]}
                >
                  {toast.metadata.manaCount} Mana
                </Text>
              </View>
            )}

            {/* Progress bar for loading */}
            {toast.type === 'loading' && toast.metadata && typeof toast.metadata === 'object' && toast.metadata.progress !== undefined && (
              <View style={tw('mt-3')}>
                <View
                  style={[
                    tw('h-1 rounded-full'),
                    { backgroundColor: colors.border },
                  ]}
                >
                  <Animated.View
                    style={[
                      tw('h-full rounded-full'),
                      {
                        backgroundColor: toastColors.bg,
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    tw('text-xs mt-1 text-right'),
                    { color: `${colors.text}99` }, // 60% opacity
                  ]}
                >
                  {toast.metadata && typeof toast.metadata === 'object' && toast.metadata.progress !== undefined ? Math.round(toast.metadata.progress) : 0}%
                </Text>
              </View>
            )}

            {/* Action button */}
            {toast.action && (
              <View style={tw('mt-3')}>
                <Button
                  title={toast.action.label}
                  variant="primary"
                  onPress={() => {
                    console.debug('🔵 Action button pressed!');
                    toast.action?.onPress();
                    if (onAction) onAction();
                  }}
                  style={{
                    alignSelf: 'flex-start',
                  }}
                />
              </View>
            )}
          </View>

          {/* Dismiss button */}
          <TouchableOpacity
            onPress={handleDismiss}
            style={tw('p-1 ml-2')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="close"
              size={20}
              color={`${colors.text}99`} // 60% opacity
            />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

export default Toast;