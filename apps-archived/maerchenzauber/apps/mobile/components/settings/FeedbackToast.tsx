import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Text from '../atoms/Text';

interface FeedbackToastProps {
	visible: boolean;
	opacity: Animated.Value;
	message?: string;
}

export default function FeedbackToast({
	visible,
	opacity,
	message = 'Vielen Dank für dein Feedback! 👍',
}: FeedbackToastProps) {
	if (!visible) return null;

	return (
		<Animated.View style={[styles.toast, { opacity }]}>
			<View style={styles.toastContent}>
				<Text style={styles.toastText}>{message}</Text>
			</View>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	toast: {
		position: 'absolute',
		bottom: 64,
		left: 0,
		right: 0,
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 9999,
	},
	toastContent: {
		backgroundColor: 'rgba(0, 0, 0, 0.8)',
		paddingVertical: 12,
		paddingHorizontal: 24,
		borderRadius: 30,
	},
	toastText: {
		color: '#FFFFFF',
		fontSize: 16,
	},
});
