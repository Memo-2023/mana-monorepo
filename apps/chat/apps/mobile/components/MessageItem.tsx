import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';
import SkeletonLoader from './SkeletonLoader';
import TypingIndicator from './TypingIndicator';

type MessageProps = {
	text: string;
	sender: 'user' | 'ai';
	timestamp: Date;
	isLoading?: boolean;
};

export default function MessageItem({ text, sender, timestamp, isLoading = false }: MessageProps) {
	const { colors } = useTheme();

	const isUser = sender === 'user';

	return (
		<View
			style={[
				styles.container,
				isUser ? styles.userContainer : styles.aiContainer,
				{ backgroundColor: isUser ? colors.primary : colors.card },
			]}
		>
			{isLoading && sender === 'ai' ? (
				// Zeige Skeleton oder TypingIndicator wenn geladen wird
				<>
					<SkeletonLoader lines={4} style={styles.skeletonContainer} />
					<TypingIndicator dotColor={colors.text + '80'} style={styles.typingIndicator} />
				</>
			) : (
				// Zeige die eigentliche Nachricht
				<Text style={[styles.messageText, { color: isUser ? '#fff' : colors.text }]}>{text}</Text>
			)}

			<Text
				style={[styles.timestamp, { color: isUser ? 'rgba(255,255,255,0.7)' : colors.text + '80' }]}
			>
				{timestamp.getHours().toString().padStart(2, '0')}:
				{timestamp.getMinutes().toString().padStart(2, '0')}
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 12,
		borderRadius: 16,
		marginVertical: 4,
		marginHorizontal: 12,
	},
	userContainer: {
		maxWidth: '80%',
		alignSelf: 'flex-start',
		borderBottomLeftRadius: 4,
	},
	aiContainer: {
		width: '95%',
		alignSelf: 'flex-end',
		borderBottomRightRadius: 4,
	},
	messageText: {
		fontSize: 16,
		lineHeight: 22,
	},
	timestamp: {
		fontSize: 12,
		marginTop: 4,
		alignSelf: 'flex-end',
	},
	skeletonContainer: {
		padding: 0,
		margin: 0,
		opacity: 0.8,
	},
	typingIndicator: {
		marginLeft: -5,
		marginTop: 5,
	},
});
