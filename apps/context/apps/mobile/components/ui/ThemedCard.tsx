import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { Text } from './Text';
import { useTheme } from '~/utils/theme/theme';

interface ThemedCardProps {
	children: React.ReactNode;
	title?: string;
	onPress?: () => void;
	style?: StyleProp<ViewStyle>;
	titleStyle?: StyleProp<TextStyle>;
	contentStyle?: StyleProp<ViewStyle>;
}

export const ThemedCard: React.FC<ThemedCardProps> = ({
	children,
	title,
	onPress,
	style,
	titleStyle,
	contentStyle,
}) => {
	const { isDark } = useTheme();

	const CardContainer = onPress ? TouchableOpacity : View;

	return (
		<CardContainer
			style={[
				styles.container,
				{
					backgroundColor: isDark ? '#1f2937' : '#ffffff',
					borderColor: isDark ? '#374151' : '#e5e7eb',
				},
				style,
			]}
			onPress={onPress}
			activeOpacity={onPress ? 0.7 : undefined}
		>
			{title && (
				<Text
					style={[
						styles.title,
						{
							color: isDark ? '#f9fafb' : '#111827',
						},
						titleStyle,
					]}
				>
					{title}
				</Text>
			)}
			<View style={[styles.content, contentStyle]}>{children}</View>
		</CardContainer>
	);
};

const styles = StyleSheet.create({
	container: {
		borderRadius: 8,
		borderWidth: 1,
		marginBottom: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2,
	},
	title: {
		fontSize: 18,
		fontWeight: 'bold',
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: '#e5e7eb',
	},
	content: {
		padding: 16,
	},
});
