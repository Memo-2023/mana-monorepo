import React from 'react';
import { View, Platform } from 'react-native';
import { Text } from './Text';
import { useThemeColors } from '~/utils/themeUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '~/utils/spacing';

interface PageHeaderProps {
	title: string;
	withHorizontalPadding?: boolean;
}

export function PageHeader({ title, withHorizontalPadding = true }: PageHeaderProps) {
	const colors = useThemeColors();
	const insets = useSafeAreaInsets();

	return (
		<View
			style={{
				paddingTop: Platform.OS === 'ios' ? insets.top + spacing.lg : spacing.lg,
				paddingHorizontal: withHorizontalPadding ? spacing.container.horizontal : 0,
				paddingBottom: spacing.lg,
				backgroundColor: colors.background,
				borderBottomWidth: 1,
				borderBottomColor: colors.border,
			}}
		>
			<View style={{ paddingHorizontal: withHorizontalPadding ? 0 : spacing.container.horizontal }}>
				<Text
					style={{
						fontSize: 28,
						fontWeight: '700',
						color: colors.foreground,
						letterSpacing: 0.3,
						lineHeight: 34,
					}}
				>
					{title}
				</Text>
			</View>
		</View>
	);
}
