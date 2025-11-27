import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import Auth from '../components/Auth';
import { useTheme } from '../utils/themeContext';

export default function LoginScreen() {
	const { isDarkMode } = useTheme();

	return (
		<>
			<Stack.Screen
				options={{
					title: 'Anmelden',
					headerStyle: {
						backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
					},
					headerTintColor: isDarkMode ? '#F9FAFB' : '#1F2937',
				}}
			/>
			<View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}>
				<Auth />
			</View>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
	},
});
