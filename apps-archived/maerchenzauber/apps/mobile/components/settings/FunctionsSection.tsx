import React from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Button from '../atoms/Button';

interface FunctionsSectionProps {
	onFeedbackPress: () => void;
	isWideScreen?: boolean;
}

export default function FunctionsSection({
	onFeedbackPress,
	isWideScreen = false,
}: FunctionsSectionProps) {
	const buttonStyle = {
		marginBottom: isWideScreen ? 12 : 8,
	};

	return (
		<View style={styles.container}>
			<Button
				title="Archiv"
				onPress={() => router.push('/archive')}
				color="#333333"
				variant="primary"
				size="lg"
				style={buttonStyle}
				iconName="archive"
				iconPosition="left"
			/>

			<Button
				title="Hilfe"
				onPress={() => router.push('/help')}
				color="#333333"
				variant="primary"
				size="lg"
				style={buttonStyle}
				iconName="help-circle"
				iconPosition="left"
			/>

			<Button
				title="Feature Requests"
				onPress={() => router.push('/feedback')}
				color="#333333"
				variant="primary"
				size="lg"
				style={buttonStyle}
				iconName="thumbs-up"
				iconPosition="left"
			/>

			<Button
				title="Feedback geben"
				onPress={onFeedbackPress}
				color="#333333"
				variant="primary"
				size="lg"
				style={buttonStyle}
				iconName="chat"
				iconPosition="left"
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		marginBottom: 16,
	},
});
