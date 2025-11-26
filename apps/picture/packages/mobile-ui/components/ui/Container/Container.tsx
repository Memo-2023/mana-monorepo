import { ReactNode } from 'react';
import { ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type ContainerProps = {
  /** Content to render inside the container */
  children: ReactNode;
  /** Background color */
  backgroundColor?: string;
  /** Apply padding to the container */
  padding?: boolean;
  /** Custom padding value (overrides default) */
  paddingValue?: number;
  /** Additional styles */
  style?: ViewStyle;
  /** CSS class names (NativeWind/Tailwind) */
  className?: string;
};

/**
 * Safe area container component that wraps content with padding and safe area handling.
 *
 * @example
 * ```tsx
 * <Container>
 *   <Text>Content</Text>
 * </Container>
 *
 * <Container backgroundColor="#F3F4F6" padding={false}>
 *   <Text>Custom container</Text>
 * </Container>
 * ```
 */
export const Container = ({
  children,
  backgroundColor = '#FFFFFF',
  padding = true,
  paddingValue = 24,
  style,
  className = '',
}: ContainerProps) => {
  return (
    <SafeAreaView
      className={`flex flex-1 ${padding ? `p-6` : ''} ${className}`}
      style={{
        backgroundColor,
        ...(padding && paddingValue !== 24 && { padding: paddingValue }),
        ...style,
      }}
    >
      {children}
    </SafeAreaView>
  );
};
