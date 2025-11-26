import { View, Pressable, ViewStyle, TextStyle } from 'react-native';
import { Text } from '../Text/Text';
import { Icon } from '../Icon/Icon';

export type TagVariant = 'solid' | 'outline' | 'subtle';
export type TagSize = 'sm' | 'md' | 'lg';

export type TagProps = {
  /** Tag label */
  label: string;
  /** Visual variant */
  variant?: TagVariant;
  /** Size */
  size?: TagSize;
  /** Tag color */
  color?: string;
  /** Icon name (optional) */
  icon?: string;
  /** Show close button */
  onClose?: () => void;
  /** Make tag pressable */
  onPress?: () => void;
  /** Additional styles */
  style?: ViewStyle;
};

/**
 * Tag/Chip component for labels, categories, and filters.
 *
 * @example
 * ```tsx
 * <Tag label="Featured" color="#3B82F6" />
 * <Tag label="New" variant="solid" color="#10B981" />
 * <Tag label="Category" icon="tag" onClose={() => {}} />
 * ```
 */
export function Tag({
  label,
  variant = 'subtle',
  size = 'md',
  color = '#3B82F6',
  icon,
  onClose,
  onPress,
  style,
}: TagProps) {
  const sizeConfig = {
    sm: { paddingX: 8, paddingY: 4, fontSize: 12, iconSize: 14 },
    md: { paddingX: 12, paddingY: 6, fontSize: 14, iconSize: 16 },
    lg: { paddingX: 16, paddingY: 8, fontSize: 16, iconSize: 18 },
  };

  const config = sizeConfig[size];

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'solid':
        return {
          container: {
            backgroundColor: color,
          },
          text: {
            color: '#FFFFFF',
          },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: color,
          },
          text: {
            color: color,
          },
        };
      case 'subtle':
      default:
        return {
          container: {
            backgroundColor: `${color}20`,
          },
          text: {
            color: color,
          },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const isInteractive = !!(onPress || onClose);

  return (
    <Pressable
      onPress={onPress}
      disabled={!isInteractive}
      style={({ pressed }) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: config.paddingX,
          paddingVertical: config.paddingY,
          borderRadius: 999,
          ...variantStyles.container,
          ...(pressed && isInteractive && { opacity: 0.7 }),
        },
        style,
      ]}
    >
      {/* Icon */}
      {icon && (
        <Icon
          name={icon}
          size={config.iconSize}
          color={variantStyles.text.color}
          style={{ marginRight: 6 }}
        />
      )}

      {/* Label */}
      <Text
        variant="label"
        style={{
          fontSize: config.fontSize,
          ...variantStyles.text,
        }}
      >
        {label}
      </Text>

      {/* Close button */}
      {onClose && (
        <Pressable
          onPress={onClose}
          hitSlop={8}
          style={({ pressed }) => ({
            marginLeft: 6,
            opacity: pressed ? 0.5 : 1,
          })}
        >
          <Icon
            name="close"
            size={config.iconSize}
            color={variantStyles.text.color}
          />
        </Pressable>
      )}
    </Pressable>
  );
}

/**
 * Container for multiple tags with wrapping.
 *
 * @example
 * ```tsx
 * <TagGroup>
 *   <Tag label="React" color="#61DAFB" />
 *   <Tag label="TypeScript" color="#3178C6" />
 *   <Tag label="Mobile" color="#10B981" />
 * </TagGroup>
 * ```
 */
export function TagGroup({
  children,
  gap = 8,
  style,
}: {
  children: React.ReactNode;
  gap?: number;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
