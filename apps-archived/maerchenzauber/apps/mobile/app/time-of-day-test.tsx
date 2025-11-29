import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import TimeOfDayTester from '../components/dev/TimeOfDayTester';
import CommonHeader from '../components/molecules/CommonHeader';

export default function TimeOfDayTestScreen() {
	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<CommonHeader title="Time of Day Tester" showBack />
			<TimeOfDayTester />
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#000000',
	},
});
