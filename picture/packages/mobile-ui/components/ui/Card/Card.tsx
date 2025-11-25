import { View, Pressable, ViewStyle } from 'react-native';

export type CardProps = {
  /** Card content */
  children: React.ReactNode;
  /** Make card pressable */
  onPress?: () => void;
  /** Background color */
  backgroundColor?: string;
  /** Border radius */
  borderRadius?: number;
  /** Padding inside card */
  padding?: number;
  /** Add shadow */
  shadow?: boolean;
  /** Add border */
  border?: boolean;
  /** Border color */
  borderColor?: string;
  /** Additional styles */
  style?: ViewStyle;
};

/**
 * Container card component with optional press interaction.
 *
 * @example
 * ```tsx
 * <Card>
 *   <Text variant="h3">Card Title</Text>
 *   <Text>Card content goes here</Text>
 * </Card>
 *
 * <Card onPress={() => {}} shadow>
 *   <Text>Pressable card</Text>
 * </Card>
 * ```
 */
export function Card({
  children,
  onPress,
  backgroundColor = '#FFFFFF',
  borderRadius = 12,
  padding = 16,
  shadow = true,
  border = false,
  borderColor = '#E5E7EB',
  style,
}: CardProps) {
  const cardStyles: ViewStyle = {
    backgroundColor,
    borderRadius,
    padding,
    ...(border && {
      borderWidth: 1,
      borderColor,
    }),
    ...(shadow && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    }),
    ...style,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          cardStyles,
          pressed && { opacity: 0.8 },
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={cardStyles}>{children}</View>;
}
