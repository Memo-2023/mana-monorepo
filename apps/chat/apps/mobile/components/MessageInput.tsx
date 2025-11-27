import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';

type MessageInputProps = {
	onSend: (message: string) => void;
	isLoading?: boolean;
};

// Öffentliche Methoden über Ref
export interface MessageInputRef {
	focus: () => void;
}

const MessageInput = forwardRef<MessageInputRef, MessageInputProps>(function MessageInput(
	{ onSend, isLoading = false },
	ref
) {
	const [message, setMessage] = useState('');
	const { colors } = useTheme();
	const inputRef = useRef<TextInput>(null);

	// Stellt die focus-Methode über ref zur Verfügung
	useImperativeHandle(ref, () => ({
		focus: () => {
			if (inputRef.current) {
				inputRef.current.focus();
			}
		},
	}));

	const handleSend = () => {
		if (message.trim() && !isLoading) {
			onSend(message.trim());
			setMessage('');
		}
	};

	// Tastatur-Event-Handler für Enter-Taste (besonders wichtig für Web)
	const handleKeyPress = (e: any) => {
		// Prüfen auf Enter ohne Shift für Submit
		if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
			e.preventDefault(); // Verhindert Zeilenumbruch
			handleSend();
		}
	};

	return (
		<View style={[styles.container, { backgroundColor: colors.card }]}>
			<TextInput
				ref={inputRef}
				style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
				placeholder="Nachricht eingeben..."
				placeholderTextColor={colors.text + '80'}
				value={message}
				onChangeText={setMessage}
				multiline
				maxLength={1000}
				editable={!isLoading}
				onSubmitEditing={handleSend}
				blurOnSubmit={false}
				onKeyPress={handleKeyPress}
			/>
			<TouchableOpacity
				style={[styles.sendButton, { backgroundColor: colors.primary }]}
				onPress={handleSend}
				disabled={!message.trim() || isLoading}
			>
				{isLoading ? (
					<ActivityIndicator color="#fff" size="small" />
				) : (
					<Ionicons name="send" size={20} color="#fff" />
				)}
			</TouchableOpacity>
		</View>
	);
});

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderTopWidth: StyleSheet.hairlineWidth,
		borderTopColor: 'rgba(0,0,0,0.1)',
		width: '100%',
		maxWidth: 1200,
		alignSelf: 'center',
	},
	input: {
		flex: 1,
		borderRadius: 20,
		paddingHorizontal: 16,
		paddingVertical: 10,
		maxHeight: 120,
		marginRight: 8,
	},
	sendButton: {
		width: 44,
		height: 44,
		borderRadius: 22,
		justifyContent: 'center',
		alignItems: 'center',
	},
});

export default MessageInput;
