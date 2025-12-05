import React, { useState, useRef } from 'react';
import {
	View,
	TextInput,
	StyleSheet,
	Pressable,
	Platform,
	KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/utils/theme/theme';
import { createSpace } from '~/services/supabaseService';

interface InlineSpaceCreatorProps {
	onCancel: () => void;
	onCreated: (spaceId: string) => void;
}

export const InlineSpaceCreator: React.FC<InlineSpaceCreatorProps> = ({ onCancel, onCreated }) => {
	const { isDark } = useTheme();
	const [name, setName] = useState('');
	const [isHovered, setIsHovered] = useState(false);
	const [isPressed, setIsPressed] = useState(false);
	const [creating, setCreating] = useState(false);
	const inputRef = useRef<TextInput>(null);

	// Fokussiere das Input-Feld beim Rendern
	React.useEffect(() => {
		setTimeout(() => {
			inputRef.current?.focus();
		}, 100);
	}, []);

	// Funktion zum Erstellen des Space
	const handleCreateSpace = async () => {
		if (!name.trim()) return;
		if (creating) return; // Verhindert doppelte Erstellung

		try {
			setCreating(true);

			const { data, error: createError } = await createSpace(name.trim());

			if (createError) {
				console.error(`Fehler beim Erstellen des Space: ${createError.message || createError}`);
				return;
			}

			if (data) {
				// Callback für erfolgreiche Erstellung
				onCreated(data.id);
				// Formular zurücksetzen
				setName('');
			}
		} catch (err: any) {
			console.error(`Unerwarteter Fehler: ${err.message}`);
		} finally {
			setCreating(false);
		}
	};

	// Behandle Tastatureingaben (Enter und Escape)
	const handleKeyPress = (e: any) => {
		if (e.nativeEvent.key === 'Enter') {
			handleCreateSpace();
		} else if (e.nativeEvent.key === 'Escape') {
			onCancel();
		}
	};

	return (
		<View style={styles.container}>
			<View
				style={[
					styles.inputContainer,
					{
						backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
						borderColor: isDark ? '#374151' : '#d1d5db',
					},
				]}
			>
				<Ionicons name="add" size={16} color={isDark ? '#d1d5db' : '#4b5563'} style={styles.icon} />
				<TextInput
					ref={inputRef}
					style={[styles.input, { color: isDark ? '#d1d5db' : '#4b5563' }]}
					className="no-focus-outline"
					placeholder="Name des neuen Space..."
					placeholderTextColor={isDark ? '#9ca3af' : '#9ca3af'}
					value={name}
					onChangeText={setName}
					onKeyPress={handleKeyPress}
					// Entfernt, um doppelte Space-Erstellung zu verhindern
					// onSubmitEditing={handleCreateSpace}
					autoCapitalize="none"
					maxLength={50}
					editable={!creating}
				/>
			</View>

			<View style={styles.buttonsContainer}>
				<Pressable
					style={({ pressed }) => [
						styles.actionButton,
						{
							backgroundColor: pressed
								? isDark
									? '#374151'
									: '#d1d5db'
								: isDark
									? '#111827'
									: '#e5e7eb',
							borderColor: isDark ? '#1f2937' : '#d1d5db',
							opacity: pressed ? 0.8 : 1,
						},
					]}
					onPress={handleCreateSpace}
					disabled={creating || !name.trim()}
				>
					<Ionicons name="chevron-forward" size={14} color={isDark ? '#d1d5db' : '#4b5563'} />
				</Pressable>

				<Pressable style={styles.cancelButton} onPress={onCancel}>
					<Ionicons name="close" size={16} color={isDark ? '#9ca3af' : '#6b7280'} />
				</Pressable>
			</View>
		</View>
	);
};

// Globaler Stil für das Entfernen des Fokus-Outlines
if (typeof document !== 'undefined') {
	const style = document.createElement('style');
	style.textContent = `
    .no-focus-outline {
      outline: none !important;
      box-shadow: none !important;
      border-color: transparent !important;
    }
    .no-focus-outline:focus {
      outline: none !important;
      box-shadow: none !important;
      border-color: transparent !important;
    }
  `;
	document.head.appendChild(style);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		height: 28,
		marginRight: 8,
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingLeft: 14,
		paddingRight: 10,
		paddingVertical: 0,
		borderRadius: 9999,
		borderWidth: 1,
		height: 28,
		minWidth: 180,
	},
	icon: {
		marginRight: 4,
	},
	input: {
		flex: 1,
		height: '100%',
		padding: 0,
		fontSize: 14,
		fontWeight: '500',
	},
	buttonsContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginLeft: 4,
	},
	actionButton: {
		width: 24,
		height: 24,
		borderRadius: 9999,
		borderWidth: 1,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 4,
	},
	cancelButton: {
		width: 20,
		height: 20,
		borderRadius: 9999,
		justifyContent: 'center',
		alignItems: 'center',
	},
});
