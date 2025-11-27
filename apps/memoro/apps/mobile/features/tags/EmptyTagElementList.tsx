import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from '@/components/atoms/Icon';
import { useTheme } from '@/components/theme';
import useSettingsStore from '@/stores/settingsStore';
import { t } from '@lingui/macro';

export default function EmptyTagElementList() {
	const { theme } = useTheme();
	const { showDebugBorders } = useSettingsStore();

	const debugBorderStyles = {
		container: showDebugBorders
			? {
					borderWidth: 2,
					borderColor: '#FF0000',
				}
			: {},
		iconContainer: showDebugBorders
			? {
					borderWidth: 2,
					borderColor: '#00FF00',
				}
			: {},
		textContainer: showDebugBorders
			? {
					borderWidth: 2,
					borderColor: '#0000FF',
				}
			: {},
	};

	return (
		<View style={[styles.container, debugBorderStyles.container]}>
			<View style={[styles.iconContainer, debugBorderStyles.iconContainer]}>
				<Icon name="add" size={48} color={theme.colors.primary} />
			</View>
			<View style={[styles.textContainer, debugBorderStyles.textContainer]}>
				<Text style={[styles.title, { color: theme.colors.primary }]}>
					{t`No Tags Created Yet`}
				</Text>
				<Text style={[styles.description, { color: theme.colors.textSecondary }]}>
					{t`Create new tags to organize your memos. Click the + symbol in the top right corner.`}
				</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'flex-start',
		padding: 20,
		marginTop: 200,
	},
	iconContainer: {
		marginBottom: 16,
		alignItems: 'center',
	},
	textContainer: {
		alignItems: 'center',
	},
	title: {
		fontSize: 20,
		fontWeight: '600',
		marginBottom: 8,
		textAlign: 'center',
	},
	description: {
		fontSize: 16,
		textAlign: 'center',
		lineHeight: 24,
	},
});
