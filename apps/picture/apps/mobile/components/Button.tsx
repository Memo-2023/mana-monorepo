import { forwardRef, ReactNode } from 'react';
import { Pressable, PressableProps, View, ActivityIndicator, ViewStyle } from 'react-native';
import { useTheme } from '~/contexts/ThemeContext';
import { Icon } from './Icon';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  title?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: string;
  iconPosition?: 'left' | 'right';
  iconSize?: number;
  iconColor?: string;
  iconWeight?: 'regular' | 'medium' | 'semibold' | 'bold';
  loading?: boolean;
  children?: ReactNode;
  fullWidth?: boolean;
} & PressableProps;

export const Button = forwardRef<View, ButtonProps>(({
  title,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  iconSize,
  iconColor,
  iconWeight = 'regular',
  loading = false,
  children,
  fullWidth = false,
  onPress,
  className,
  style,
  disabled,
  ...pressableProps
}, ref) => {
  const { theme } = useTheme();

  // Size config
  const sizeConfig = {
    sm: { paddingX: 12, paddingY: 8, fontSize: 14, iconSize: 16 },
    md: { paddingX: 16, paddingY: 12, fontSize: 16, iconSize: 20 },
    lg: { paddingX: 24, paddingY: 16, fontSize: 18, iconSize: 24 },
  };

  const config = sizeConfig[size];

  // Variant colors
  const getVariantStyles = () => {
    const isDisabled = disabled || loading;

    switch (variant) {
      case 'danger':
        return {
          backgroundColor: theme.colors.error,
          textColor: theme.colors.text.inverse,
          iconColor: theme.colors.text.inverse,
        };
      case 'secondary':
        return {
          backgroundColor: theme.colors.secondary.default,
          textColor: theme.colors.secondary.contrast,
          iconColor: theme.colors.secondary.contrast,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          textColor: theme.colors.primary.default,
          iconColor: theme.colors.primary.default,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          textColor: theme.colors.primary.default,
          iconColor: theme.colors.primary.default,
          borderColor: theme.colors.primary.default,
          borderWidth: 1,
        };
      default: // primary
        return {
          backgroundColor: theme.colors.primary.default,
          textColor: theme.colors.primary.contrast,
          iconColor: theme.colors.primary.contrast,
        };
    }
  };

  const variantStyles = getVariantStyles();

  // Build styles
  const buttonStyles: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: config.paddingX,
    paddingVertical: config.paddingY,
    borderRadius: 8,
    backgroundColor: variantStyles.backgroundColor,
    ...(variantStyles.borderWidth && {
      borderWidth: variantStyles.borderWidth,
      borderColor: variantStyles.borderColor,
    }),
    ...(fullWidth && { width: '100%' }),
    ...(disabled || loading ? { opacity: theme.opacity.disabled } : {}),
    ...(style as ViewStyle),
  };

  const handlePress = (e: any) => {
    if (onPress && !disabled && !loading) {
      onPress(e);
    }
  };

  // Determine icon size and color
  const actualIconSize = iconSize || config.iconSize;
  const actualIconColor = iconColor || variantStyles.iconColor;

  const renderContent = () => {
    if (children) {
      return children;
    }

    return (
      <>
        {loading && (
          <ActivityIndicator
            size="small"
            color={actualIconColor}
            style={{ marginRight: title ? 8 : 0 }}
          />
        )}
        {!loading && icon && iconPosition === 'left' && (
          <Icon
            name={icon}
            size={actualIconSize}
            color={actualIconColor}
            weight={iconWeight}
            style={{ marginRight: title ? 8 : 0 }}
          />
        )}
        {title && (
          <Text
            variant="button"
            weight="semibold"
            align="center"
            style={{
              color: variantStyles.textColor,
              fontSize: config.fontSize,
            }}
          >
            {title}
          </Text>
        )}
        {!loading && icon && iconPosition === 'right' && (
          <Icon
            name={icon}
            size={actualIconSize}
            color={actualIconColor}
            weight={iconWeight}
            style={{ marginLeft: title ? 8 : 0 }}
          />
        )}
      </>
    );
  };

  return (
    <Pressable
      ref={ref}
      {...pressableProps}
      disabled={disabled || loading}
      onPress={handlePress}
      style={({ pressed }) => [
        buttonStyles,
        pressed && !disabled && !loading && { opacity: theme.opacity.pressed },
      ]}
      className={className}
    >
      {renderContent()}
    </Pressable>
  );
});

Button.displayName = 'Button';
