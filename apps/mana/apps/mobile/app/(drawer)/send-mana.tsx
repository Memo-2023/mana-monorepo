import React from 'react';
import { Stack } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { Container } from '~/components/Container';
import SendMana from '../../components/SendMana';
import { useTheme } from '../../utils/themeContext';

export default function SendManaScreen() {
	const { isDarkMode } = useTheme();

	const styles = StyleSheet.create({
		scrollView: {
			flex: 1,
			backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
		},
	});

	return (
		<>
			<Stack.Screen
				options={{
					title: 'Mana senden',
					headerLargeTitle: true,
				}}
			/>
			<Container>
				<ScrollView style={styles.scrollView}>
					<SendMana />
				</ScrollView>
			</Container>
		</>
	);
}
