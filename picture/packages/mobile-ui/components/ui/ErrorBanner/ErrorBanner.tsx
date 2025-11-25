import { View, Pressable, ViewStyle } from 'react-native';
import { Text } from '../Text/Text';
import { Icon } from '../Icon/Icon';

export type ErrorBannerVariant = 'error' | 'warning' | 'info' | 'success';

export type ErrorBannerProps = {
  /** Message to display */
  message: string;
  /** Callback when dismiss button is pressed */
  onDismiss: () => void;
  /** Banner variant */
  variant?: ErrorBannerVariant;
  /** Position from top */
  top?: number;
  /** Horizontal margin */
  horizontalMargin?: number;
  /** Custom background color (overrides variant) */
  backgroundColor?: string;
  /** Custom text color */
  textColor?: string;
  /** Custom icon name */
  icon?: string;
  /** Additional styles */
  style?: ViewStyle;
};

const variantConfig: Record<ErrorBannerVariant, { bg: string; icon: string }> = {
  error: {
    bg: '#EF4444', // red-500
    icon: 'alert-circle',
  },
  warning: {
    bg: '#F59E0B', // amber-500
    icon: 'warning',
  },
  info: {
    bg: '#3B82F6', // blue-500
    icon: 'information-circle',
  },
  success: {
    bg: '#10B981', // green-500
    icon: 'checkmark-circle',
  },
};

/**
 * Banner component for displaying error, warning, info, or success messages.
 *
 * @example
 * ```tsx
 * <ErrorBanner
 *   message="Something went wrong"
 *   onDismiss={() => setError(null)}
 * />
 *
 * <ErrorBanner
 *   message="Changes saved successfully"
 *   variant="success"
 *   onDismiss={() => {}}
 * />
 * ```
 */
export function ErrorBanner({
  message,
  onDismiss,
  variant = 'error',
  top = 60,
  horizontalMargin = 16,
  backgroundColor,
  textColor = '#FFFFFF',
  icon,
  style,
}: ErrorBannerProps) {
  const config = variantConfig[variant];
  const bgColor = backgroundColor || config.bg;
  const iconName = icon || config.icon;

  return (
    <View
      style={{
        position: 'absolute',
        top,
        left: horizontalMargin,
        right: horizontalMargin,
        backgroundColor: bgColor,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        zIndex: 1000,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
        ...style,
      }}
    >
      {/* Message with Icon */}
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
        <Icon
          name={iconName}
          size={20}
          color={textColor}
          style={{ marginRight: 12 }}
        />
        <Text
          variant="body"
          style={{ color: textColor, flex: 1 }}
        >
          {message}
        </Text>
      </View>

      {/* Dismiss Button */}
      <Pressable
        onPress={onDismiss}
        hitSlop={8}
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Icon name="close" size={20} color={textColor} />
      </Pressable>
    </View>
  );
}
