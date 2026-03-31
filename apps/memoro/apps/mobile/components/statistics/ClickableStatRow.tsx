import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import Icon from '~/components/atoms/Icon';
import colors from '~/tailwind.config.js';

interface ClickableStatRowProps {
	title: string;
	value: string;
	icon: string;
	subtitle?: string;
	onPress?: () => void;
	isClickable?: boolean;
}

/**
 * Clickable version of StatRow for interactive elements like memo links
 */
const ClickableStatRow: React.FC<ClickableStatRowProps> = ({
	title,
	value,
	icon,
	subtitle,
	onPress,
	isClickable = true,
}) => {
	const { isDark, themeVariant } = useTheme();

	const textColor = isDark ? '#FFFFFF' : '#000000';
	const textSecondaryColor = isDark ? '#CCCCCC' : '#666666';
	const primaryColor = isDark
		? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.primary
		: (colors as any).theme?.extend?.colors?.[themeVariant]?.primary;
	const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

	const contentBackgroundColor = isDark
		? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.contentBackgroundHover
		: (colors as any).theme?.extend?.colors?.[themeVariant]?.contentBackgroundHover;

	const content = (isPressed?: boolean) => (
		<View
			style={{
				flexDirection: 'row',
				alignItems: 'center',
				paddingVertical: 10,
				paddingHorizontal: 12,
				backgroundColor: isPressed
					? isDark
						? 'rgba(255, 255, 255, 0.08)'
						: 'rgba(0, 0, 0, 0.05)'
					: isDark
						? 'rgba(255, 255, 255, 0.03)'
						: 'rgba(0, 0, 0, 0.02)',
				borderRadius: 12,
			}}
		>
			<Icon name={icon} size={22} color={primaryColor} />
			<View style={{ flex: 1, marginLeft: 14 }}>
				<Text
					style={{
						fontSize: 14,
						fontWeight: '500',
						color: textColor,
					}}
				>
					{title}
				</Text>
				{subtitle && (
					<Text
						style={{
							fontSize: 12,
							color: textSecondaryColor,
							marginTop: 2,
						}}
						numberOfLines={1}
						ellipsizeMode="tail"
					>
						{subtitle}
					</Text>
				)}
			</View>
			<View
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					gap: 6,
				}}
			>
				<Text
					style={{
						fontSize: 17,
						fontWeight: '700',
						color: textColor,
						textAlign: 'right',
					}}
				>
					{value}
				</Text>
				{isClickable && onPress && (
					<Icon name="chevron-forward" size={18} color={textSecondaryColor} />
				)}
			</View>
		</View>
	);

	if (isClickable && onPress) {
		return (
			<Pressable
				onPress={onPress}
				style={({ pressed }) => ({
					opacity: pressed ? 0.7 : 1,
				})}
			>
				{({ pressed }) => content(pressed)}
			</Pressable>
		);
	}

	return content(false);
};

export default ClickableStatRow;
