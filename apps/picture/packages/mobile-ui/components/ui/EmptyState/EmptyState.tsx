import { View, ViewStyle } from 'react-native';
import { Text } from '../Text/Text';
import { Icon } from '../Icon/Icon';

export type EmptyStateProps = {
	/** Icon name (Ionicons/SF Symbol) or emoji */
	icon?: string;
	/** Emoji to display instead of icon */
	emoji?: string;
	/** Icon size */
	iconSize?: number;
	/** Icon color */
	iconColor?: string;
	/** Title text */
	title: string;
	/** Description text */
	description: string;
	/** Title color */
	titleColor?: string;
	/** Description color */
	descriptionColor?: string;
	/** Container padding */
	padding?: number;
	/** Additional container styles */
	style?: ViewStyle;
	/** Additional content below description */
	children?: React.ReactNode;
};

/**
 * Empty state component for displaying when there's no content.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon="images"
 *   title="No images yet"
 *   description="Start creating to see your images here"
 * />
 *
 * <EmptyState
 *   emoji="📸"
 *   title="No photos"
 *   description="Take your first photo to get started"
 * />
 * ```
 */
export function EmptyState({
	icon,
	emoji,
	iconSize = 60,
	iconColor = '#9CA3AF',
	title,
	description,
	titleColor = '#1F2937',
	descriptionColor = '#6B7280',
	padding = 32,
	style,
	children,
}: EmptyStateProps) {
	return (
		<View
			style={{
				flex: 1,
				justifyContent: 'center',
				alignItems: 'center',
				padding,
				...style,
			}}
		>
			{/* Icon or Emoji */}
			{emoji ? (
				<Text style={{ fontSize: iconSize, marginBottom: 16 }}>{emoji}</Text>
			) : icon ? (
				<Icon name={icon} size={iconSize} color={iconColor} style={{ marginBottom: 16 }} />
			) : null}

			{/* Title */}
			<Text
				variant="h3"
				weight="semibold"
				align="center"
				color={titleColor}
				style={{ marginBottom: 8 }}
			>
				{title}
			</Text>

			{/* Description */}
			<Text variant="body" align="center" color={descriptionColor}>
				{description}
			</Text>

			{/* Optional children (e.g., action button) */}
			{children && <View style={{ marginTop: 24 }}>{children}</View>}
		</View>
	);
}
