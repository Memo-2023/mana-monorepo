import { Pressable, Text, ActivityIndicator } from 'react-native';

import { useTheme } from '~/utils/themeContext';

interface ButtonProps {
	title: string;
	onPress: () => void;
	variant?: 'primary' | 'secondary' | 'ghost';
	loading?: boolean;
	disabled?: boolean;
}

export function Button({ title, onPress, variant = 'primary', loading, disabled }: ButtonProps) {
	const { colors } = useTheme();

	const bgColor =
		variant === 'primary'
			? colors.primary
			: variant === 'secondary'
				? colors.backgroundTertiary
				: 'transparent';

	const textColor = variant === 'primary' ? '#FFFFFF' : colors.text;

	return (
		<Pressable
			onPress={onPress}
			disabled={disabled || loading}
			style={{
				backgroundColor: bgColor,
				paddingHorizontal: 20,
				paddingVertical: 12,
				borderRadius: 10,
				opacity: disabled ? 0.5 : 1,
				alignItems: 'center',
			}}
		>
			{loading ? (
				<ActivityIndicator color={textColor} size="small" />
			) : (
				<Text style={{ color: textColor, fontWeight: '600', fontSize: 16 }}>{title}</Text>
			)}
		</Pressable>
	);
}
