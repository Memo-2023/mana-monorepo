import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import MessageItem from './MessageItem';

type Message = {
	id: string;
	text: string;
	sender: 'user' | 'ai';
	timestamp: Date;
	isLoading?: boolean;
};

type MessageListProps = {
	messages: Message[];
	isLoading?: boolean;
};

export default function MessageList({ messages, isLoading = false }: MessageListProps) {
	const renderMessageItem = ({ item, index }: { item: Message; index: number }) => {
		// Wenn die Nachricht die letzte ist und vom KI-Assistenten stammt,
		// zeigen wir den Lade-Indikator an, wenn isLoading=true ist
		const isLastMessage = index === messages.length - 1;
		const isLastAIMessage = isLastMessage && item.sender === 'ai';
		const shouldShowLoading = isLoading && isLastAIMessage;

		return (
			<MessageItem
				text={item.text}
				sender={item.sender}
				timestamp={item.timestamp}
				isLoading={shouldShowLoading || item.isLoading}
			/>
		);
	};

	return (
		<FlatList
			data={messages}
			keyExtractor={(item) => item.id}
			renderItem={renderMessageItem}
			style={styles.container}
			contentContainerStyle={styles.contentContainer}
			inverted={false}
			showsVerticalScrollIndicator={false}
			ListFooterComponent={<View style={styles.footer} />}
		/>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: '100%',
		maxWidth: 800,
		alignSelf: 'center',
	},
	contentContainer: {
		paddingVertical: 16,
		paddingHorizontal: 16,
	},
	footer: {
		height: 20,
	},
});
