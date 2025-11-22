import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Animated, StyleSheet, Platform, Dimensions } from 'react-native';
import { Toast as ToastType } from '../types';
import Text from '~/components/atoms/Text';
import { useTheme } from '~/features/theme/ThemeProvider';
import Icon from '~/components/atoms/Icon';

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: string) => void;
  onAction?: () => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onDismiss, onAction }) => {
  // Early return if toast is invalid
  if (!toast || typeof toast !== 'object' || !toast.id) {
    console.debug('Invalid toast object:', toast);
    return null;
  }

  const { tw, isDark, themeVariant, colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [windowWidth, setWindowWidth] = useState(() => 
    Platform.OS === 'web' ? Dimensions.get('window').width : 0
  );

  // Update window width on resize
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    
    const updateWindowWidth = () => {
      setWindowWidth(Dimensions.get('window').width);
    };
    
    const subscription = Dimensions.addEventListener('change', updateWindowWidth);
    return () => subscription?.remove();
  }, []);

  // Animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
    // Get primary color from theme
    const primaryColor = isDark
      ? ((colors as any).theme?.extend?.colors?.dark)?.[themeVariant]?.primary
      : ((colors as any).theme?.extend?.colors)?.[themeVariant]?.primary;
    
    const baseColors = {
      success: { bg: '#10B981', border: '#059669' },
      error: { bg: '#EF4444', border: '#DC2626' },
      warning: { bg: '#F59E0B', border: '#D97706' },
      info: { bg: primaryColor || '#3B82F6', border: primaryColor || '#2563EB' },
      loading: { bg: '#6B7280', border: '#4B5563' },
    };

    return baseColors[toast.type] || baseColors.info;
  };

  const toastColors = getToastColors();

  // Get theme colors for background and text using the new theme provider
  const backgroundColor = colors.contentBackground;
  const textColor = colors.text;
  const borderColor = colors.borderStrong;

  // Get primary button colors from theme
  const getPrimaryButtonColor = () => {
    return colors.primaryButton;
  };

  const getPrimaryButtonTextColor = () => {
    return colors.primaryButtonText;
  };

  // Responsive breakpoints and max widths (similar to BaseModal)
  const BREAKPOINTS = {
    mobile: 768,
    tablet: 1024,
    desktop: 1440,
  };

  // Get responsive max width for toasts
  const getResponsiveMaxWidth = () => {
    // For toasts with features (onboarding toasts), use larger width
    const hasFeatures = toast.features && toast.features.length > 0;
    
    if (Platform.OS !== 'web') {
      // On mobile platforms, use mobile size
      return hasFeatures ? 500 : 400;
    }
    
    // Web: responsive based on window width
    if (windowWidth < BREAKPOINTS.mobile) {
      return hasFeatures ? 500 : 400;
    } else if (windowWidth < BREAKPOINTS.tablet) {
      return hasFeatures ? 600 : 500;
    } else {
      return hasFeatures ? 700 : 600;
    }
  };

  const maxWidth = getResponsiveMaxWidth();

  return (
    <Animated.View
      style={[
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
          backgroundColor,
          borderRadius: 16, // Same as MemoPreview
          borderWidth: 2, // Thicker border like MemoPreview's primary border
          borderColor: borderColor, // Theme border color
          marginBottom: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 4,
          maxWidth,
          width: '100%',
          alignSelf: 'center',
        },
      ]}
    >


      <TouchableOpacity 
        style={styles.content}
        activeOpacity={0.9}
        onPress={() => {
          if (!toast.action) {
            handleDismiss();
          }
        }}
      >
        {/* Content */}
        <View style={styles.textContainer}>
          {toast.title && (
            <Text 
              style={[
                styles.title,
                { color: textColor }
              ]}
            >
              {toast.title}
            </Text>
          )}
          
          {toast.message && (
            <Text 
              style={[
                styles.message,
                { color: `${textColor}CC` } // 80% opacity
              ]}
            >
              {toast.message}
            </Text>
          )}

          {/* Features sections */}
          {toast.features && toast.features.length > 0 && (
            <View style={styles.featuresContainer}>
              {console.debug('🎯 Rendering toast features:', toast.features)}
              {toast.features.map((feature, index) => (
                <View key={index} style={[
                  styles.featureItem,
                  { 
                    borderColor: borderColor,
                    backgroundColor: colors.contentBackgroundHover
                  }
                ]}>
                  <View style={styles.featureContent}>
                    <View style={styles.featureTitleRow}>
                      <Text style={[styles.featureTitle, { color: textColor }]}>
                        {feature.title}
                      </Text>
                      <View style={[
                        styles.featureIcon,
                        { backgroundColor: `${getPrimaryButtonColor()}20` } // 20% opacity background
                      ]}>
                        <Icon 
                          name={feature.icon} 
                          size={20} 
                          color={textColor} 
                        />
                      </View>
                    </View>
                    <Text style={[styles.featureDescription, { color: `${textColor}CC` }]}>
                      {feature.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
          
          {/* Full width action button */}
          {toast.action && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: getPrimaryButtonColor() }
              ]}
              onPress={() => {
                console.debug('🔵 Action button pressed!');
                toast.action?.onPress();
                if (onAction) onAction();
              }}
            >
              <Text style={[styles.actionButtonText, { color: getPrimaryButtonTextColor() }]}>
                {toast.action.label}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 20, // Increased from 16 to 20
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16, // Same as MemoPreview title
    fontWeight: '600', // Bold like MemoPreview
    lineHeight: 24, // Increased from 22 to 24
  },
  message: {
    fontSize: 16, // Increased from 14 to 16
    marginTop: 6, // Increased from 4 to 6
    lineHeight: 24, // Increased from 22 to 24
  },
  actionButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: '100%', // Full width
    alignItems: 'center', // Center the text
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoIconContainer: {
    position: 'absolute',
    top: 20, // Same as content padding to align with title
    right: 20, // Same as content padding
    zIndex: 10,
    height: 24, // Same as title lineHeight for perfect alignment
    justifyContent: 'center',
  },
  featuresContainer: {
    marginTop: 16,
    gap: 12,
  },
  featureItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8, // Small space between title and icon
  },
  featureContent: {
    flex: 1,
  },
  featureTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8, // Same spacing as OnboardingModal
  },
  featureTitle: {
    fontSize: 16, // Same as toast title
    fontWeight: '600', // Same as toast title
    flex: 1, // Take remaining space
  },
  featureDescription: {
    fontSize: 16, // Same as toast message
    lineHeight: 24, // Same as toast message
  },
});

export default Toast;