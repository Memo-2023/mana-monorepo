import { forwardRef, ReactNode } from 'react';
import { Pressable, PressableProps, View, ActivityIndicator, ViewStyle } from 'react-native';
import { Icon } from '../Icon/Icon';
import { Text } from '../Text/Text';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
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
  colors?: {
    primary?: string;
    primaryText?: string;
    secondary?: string;
    secondaryText?: string;
    danger?: string;
    dangerText?: string;
  };
} & PressableProps;

const defaultColors = {
  primary: '#3B82F6',
  primaryText: '#FFFFFF',
  secondary: '#6B7280',
  secondaryText: '#FFFFFF',
  danger: '#EF4444',
  dangerText: '#FFFFFF',
  disabled: 0.5,
  pressed: 0.7,
};

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
  colors,
  onPress,
  className,
  style,
  disabled,
  ...pressableProps
}, ref) => {
  const buttonColors = { ...defaultColors, ...colors };

  const sizeConfig = {
    sm: { paddingX: 12, paddingY: 8, fontSize: 14, iconSize: 16 },
    md: { paddingX: 16, paddingY: 12, fontSize: 16, iconSize: 20 },
    lg: { paddingX: 24, paddingY: 16, fontSize: 18, iconSize: 24 },
  };

  const config = sizeConfig[size];

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          backgroundColor: buttonColors.danger,
          textColor: buttonColors.dangerText,
          iconColor: buttonColors.dangerText,
        };
      case 'secondary':
        return {
          backgroundColor: buttonColors.secondary,
          textColor: buttonColors.secondaryText,
          iconColor: buttonColors.secondaryText,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          textColor: buttonColors.primary,
          iconColor: buttonColors.primary,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          textColor: buttonColors.primary,
          iconColor: buttonColors.primary,
          borderColor: buttonColors.primary,
          borderWidth: 1,
        };
      default:
        return {
          backgroundColor: buttonColors.primary,
          textColor: buttonColors.primaryText,
          iconColor: buttonColors.primaryText,
        };
    }
  };

  const variantStyles = getVariantStyles();

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
    ...(disabled || loading ? { opacity: buttonColors.disabled } : {}),
    ...(style as ViewStyle),
  };

  const handlePress = (e: any) => {
    if (onPress && !disabled && !loading) {
      onPress(e);
    }
  };

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
        pressed && !disabled && !loading && { opacity: buttonColors.pressed },
      ]}
      className={className}
    >
      {renderContent()}
    </Pressable>
  );
});

Button.displayName = 'Button';
