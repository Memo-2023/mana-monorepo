import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../utils/ThemeContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';

interface ErrorMessageProps {
	message: string;
	visible: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, visible }) => {
	const { theme } = useTheme();

	if (!visible) return null;

	return (
		<View
			style={[
				styles.container,
				{ backgroundColor: theme.colors.error + '20', borderColor: theme.colors.error },
			]}
		>
			<FontAwesome
				name="exclamation-circle"
				size={16}
				color={theme.colors.error}
				style={styles.icon}
			/>
			<Text style={[styles.message, { color: theme.colors.error }]}>{message}</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		borderRadius: 8,
		borderWidth: 1,
		marginBottom: 15,
	},
	icon: {
		marginRight: 8,
	},
	message: {
		fontSize: 14,
		flex: 1,
	},
});

export default ErrorMessage;
