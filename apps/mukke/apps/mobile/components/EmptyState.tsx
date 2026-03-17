import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';

import { useTheme } from '~/utils/themeContext';

interface EmptyStateProps {
	icon?: keyof typeof Ionicons.glyphMap;
	title: string;
	message?: string;
}

export function EmptyState({ icon = 'musical-notes-outline', title, message }: EmptyStateProps) {
	const { colors } = useTheme();

	return (
		<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
			<Ionicons name={icon} size={64} color={colors.textTertiary} />
			<Text
				style={{
					fontSize: 20,
					fontWeight: '600',
					color: colors.text,
					marginTop: 16,
					textAlign: 'center',
				}}
			>
				{title}
			</Text>
			{message && (
				<Text
					style={{
						fontSize: 15,
						color: colors.textSecondary,
						marginTop: 8,
						textAlign: 'center',
					}}
				>
					{message}
				</Text>
			)}
		</View>
	);
}
