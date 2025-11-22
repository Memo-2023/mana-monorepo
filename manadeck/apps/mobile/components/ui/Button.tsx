import React from 'react';
import { Pressable, ActivityIndicator, View, PressableProps, Platform, Animated, ViewStyle, TextStyle } from 'react-native';
import { Text } from './Text';
import { cva, type VariantProps } from 'class-variance-authority';
import { useThemeColors } from '~/utils/themeUtils';

const buttonVariants = cva('flex-row items-center justify-center rounded-lg transition-all', {
  variants: {
    variant: {
      primary: '',
      secondary: '',
      outline: 'border-2',
      ghost: '',
      danger: '',
    },
    size: {
      sm: 'px-3 py-4',
      md: 'px-4 py-5',
      lg: 'px-6 py-6',
      xl: 'px-8 py-7',
    },
    fullWidth: {
      true: 'w-full',
      false: '',
    },
    disabled: {
      true: 'opacity-50',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
    fullWidth: false,
    disabled: false,
  },
});

const textVariants = cva('font-semibold text-center', {
  variants: {
    variant: {
      primary: '',
      secondary: '',
      outline: '',
      ghost: '',
      danger: '',
    },
    size: {
      sm: 'text-base',
      md: 'text-lg',
      lg: 'text-xl',
      xl: 'text-2xl',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

export interface ButtonProps
  extends VariantProps<typeof buttonVariants>,
    Omit<PressableProps, 'style' | 'children'> {
  children: React.ReactNode;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

export const Button = React.forwardRef<View, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      disabled,
      loading,
      leftIcon,
      rightIcon,
      children,
      onPress,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    const scaleAnim = React.useRef(new Animated.Value(1)).current;
    const colors = useThemeColors();

    const handlePressIn = () => {
      if (Platform.OS === 'ios') {
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          useNativeDriver: true,
          speed: 50,
          bounciness: 4,
        }).start();
      }
    };

    const handlePressOut = () => {
      if (Platform.OS === 'ios') {
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          speed: 50,
          bounciness: 4,
        }).start();
      }
    };

    // Get variant-specific colors
    const getVariantColors = (): { backgroundColor: string; borderColor: string; textColor: string } => {
      switch (variant) {
        case 'primary':
          return {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
            textColor: colors.primaryForeground,
          };
        case 'secondary':
          return {
            backgroundColor: colors.secondary,
            borderColor: colors.secondary,
            textColor: colors.secondaryForeground,
          };
        case 'outline':
          return {
            backgroundColor: 'transparent',
            borderColor: colors.border,
            textColor: colors.foreground,
          };
        case 'ghost':
          return {
            backgroundColor: 'transparent',
            borderColor: 'transparent',
            textColor: colors.foreground,
          };
        case 'danger':
          return {
            backgroundColor: colors.destructive,
            borderColor: colors.destructive,
            textColor: colors.destructiveForeground,
          };
        default:
          return {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
            textColor: colors.primaryForeground,
          };
      }
    };

    const variantColors = getVariantColors();

    // Android ripple color based on variant
    const getRippleColor = () => {
      switch (variant) {
        case 'primary':
        case 'danger':
          return 'rgba(255, 255, 255, 0.3)';
        case 'secondary':
        case 'outline':
        case 'ghost':
        default:
          return 'rgba(0, 0, 0, 0.1)';
      }
    };

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          ref={ref}
          className={buttonVariants({
            variant,
            size,
            fullWidth,
            disabled: isDisabled,
            className,
          })}
          disabled={isDisabled}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          android_ripple={{
            color: getRippleColor(),
            borderless: false,
          }}
          style={({ pressed }) => ({
            backgroundColor: variantColors.backgroundColor,
            borderColor: variantColors.borderColor,
            borderWidth: variant === 'outline' ? 2 : 1,
            ...(Platform.OS === 'ios' ? { opacity: pressed ? 0.85 : 1 } : {}),
          })}
          {...props}>
          {loading ? (
            <ActivityIndicator
              size="small"
              color={variantColors.textColor}
            />
          ) : (
            <>
              {leftIcon && <View className="mr-2">{leftIcon}</View>}
              <Text
                className={textVariants({
                  variant,
                  size,
                })}
                style={{ color: variantColors.textColor }}>
                {children}
              </Text>
              {rightIcon && <View className="ml-2">{rightIcon}</View>}
            </>
          )}
        </Pressable>
      </Animated.View>
    );
  }
);

Button.displayName = 'Button';
