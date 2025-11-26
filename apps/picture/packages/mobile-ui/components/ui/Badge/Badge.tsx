import { View, ViewStyle } from 'react-native';
import { Text } from '../Text/Text';

export type BadgeVariant = 'solid' | 'outline' | 'dot';
export type BadgeSize = 'sm' | 'md' | 'lg';

export type BadgeProps = {
  /** Badge content (number or text) */
  content?: string | number;
  /** Visual variant */
  variant?: BadgeVariant;
  /** Size */
  size?: BadgeSize;
  /** Badge color */
  color?: string;
  /** Max number to display (shows +) */
  max?: number;
  /** Show badge even if content is 0 */
  showZero?: boolean;
  /** Additional styles */
  style?: ViewStyle;
  /** Children to wrap badge around */
  children?: React.ReactNode;
};

/**
 * Badge component for notifications, counts, and status indicators.
 *
 * @example
 * ```tsx
 * // Standalone
 * <Badge content={5} color="#EF4444" />
 *
 * // Wrapped around icon
 * <Badge content={3}>
 *   <Icon name="notifications" size={24} />
 * </Badge>
 *
 * // Dot variant
 * <Badge variant="dot" color="#10B981">
 *   <Icon name="person" size={24} />
 * </Badge>
 * ```
 */
export function Badge({
  content,
  variant = 'solid',
  size = 'md',
  color = '#EF4444',
  max = 99,
  showZero = false,
  style,
  children,
}: BadgeProps) {
  const sizeConfig = {
    sm: { minWidth: 16, height: 16, fontSize: 10, dotSize: 8 },
    md: { minWidth: 20, height: 20, fontSize: 12, dotSize: 10 },
    lg: { minWidth: 24, height: 24, fontSize: 14, dotSize: 12 },
  };

  const config = sizeConfig[size];

  // Don't show badge if content is 0 and showZero is false
  const numContent = typeof content === 'number' ? content : parseInt(content || '0', 10);
  const shouldShow = variant === 'dot' || showZero || numContent > 0;

  if (!shouldShow) {
    return children ? <>{children}</> : null;
  }

  // Format content with max
  const displayContent = typeof content === 'number' && content > max
    ? `${max}+`
    : content;

  const renderBadge = () => {
    if (variant === 'dot') {
      return (
        <View
          style={[
            {
              width: config.dotSize,
              height: config.dotSize,
              borderRadius: config.dotSize / 2,
              backgroundColor: color,
            },
            style,
          ]}
        />
      );
    }

    const containerStyle: ViewStyle = {
      minWidth: config.minWidth,
      height: config.height,
      borderRadius: config.height / 2,
      paddingHorizontal: 6,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: variant === 'solid' ? color : 'transparent',
      ...(variant === 'outline' && {
        borderWidth: 1.5,
        borderColor: color,
      }),
    };

    return (
      <View style={[containerStyle, style]}>
        <Text
          variant="caption"
          weight="semibold"
          style={{
            fontSize: config.fontSize,
            color: variant === 'solid' ? '#FFFFFF' : color,
            lineHeight: config.height,
          }}
        >
          {displayContent}
        </Text>
      </View>
    );
  };

  // If no children, return standalone badge
  if (!children) {
    return renderBadge();
  }

  // Wrap children with positioned badge
  return (
    <View style={{ position: 'relative', display: 'inline-flex' }}>
      {children}
      <View
        style={{
          position: 'absolute',
          top: -4,
          right: -4,
          zIndex: 1,
        }}
      >
        {renderBadge()}
      </View>
    </View>
  );
}
