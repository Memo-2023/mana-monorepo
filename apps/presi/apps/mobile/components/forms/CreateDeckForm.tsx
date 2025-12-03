import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { useTheme } from '../ThemeProvider';
import { createDeck } from '../../services/firestore';
import { type Deck } from '../../types/models';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface CreateDeckFormProps {
	onSuccess: (deck: Deck) => void;
	onCancel: () => void;
}

export const CreateDeckForm: React.FC<CreateDeckFormProps> = ({ onSuccess, onCancel }) => {
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [error, setError] = useState<string | null>(null);
	const { theme } = useTheme();

	const handleSubmit = async () => {
		if (!name.trim()) {
			setError('Please enter a name for your deck');
			return;
		}

		try {
			const newDeck = await createDeck({
				name: name.trim(),
				description: description.trim(),
			});
			onSuccess(newDeck);
		} catch (err) {
			setError('Failed to create deck. Please try again.');
			console.error('Error creating deck:', err);
		}
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			style={[styles.container, { backgroundColor: theme.colors.backgroundPrimary }]}
		>
			<View style={styles.header}>
				<Text style={[styles.title, { color: theme.colors.textPrimary }]}>Create New Deck</Text>
				<TouchableOpacity onPress={onCancel} style={styles.closeButton}>
					<MaterialIcons name="close" size={24} color={theme.colors.textSecondary} />
				</TouchableOpacity>
			</View>

			<View style={styles.form}>
				<View style={styles.inputContainer}>
					<Text style={[styles.label, { color: theme.colors.textSecondary }]}>Name</Text>
					<TextInput
						style={[
							styles.input,
							{
								backgroundColor: theme.colors.backgroundSecondary,
								color: theme.colors.textPrimary,
								borderColor: theme.colors.border,
							},
						]}
						value={name}
						onChangeText={setName}
						placeholder="Enter deck name"
						placeholderTextColor={theme.colors.textTertiary}
					/>
				</View>

				<View style={styles.inputContainer}>
					<Text style={[styles.label, { color: theme.colors.textSecondary }]}>
						Description (optional)
					</Text>
					<TextInput
						style={[
							styles.input,
							styles.textArea,
							{
								backgroundColor: theme.colors.backgroundSecondary,
								color: theme.colors.textPrimary,
								borderColor: theme.colors.border,
							},
						]}
						value={description}
						onChangeText={setDescription}
						placeholder="Enter deck description"
						placeholderTextColor={theme.colors.textTertiary}
						multiline
						numberOfLines={4}
					/>
				</View>

				{error && <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>}

				<View style={styles.buttons}>
					<TouchableOpacity
						style={[
							styles.button,
							styles.cancelButton,
							{ backgroundColor: theme.colors.backgroundSecondary },
						]}
						onPress={onCancel}
					>
						<Text style={[styles.buttonText, { color: theme.colors.textPrimary }]}>Cancel</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.button, styles.createButton, { backgroundColor: theme.colors.primary }]}
						onPress={handleSubmit}
					>
						<Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Create Deck</Text>
					</TouchableOpacity>
				</View>
			</View>
		</KeyboardAvoidingView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		borderBottomWidth: 1,
	},
	title: {
		fontSize: 20,
		fontWeight: '600',
	},
	closeButton: {
		padding: 8,
	},
	form: {
		padding: 16,
		gap: 16,
	},
	inputContainer: {
		gap: 8,
	},
	label: {
		fontSize: 16,
		fontWeight: '500',
	},
	input: {
		borderWidth: 1,
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
	},
	textArea: {
		minHeight: 100,
		textAlignVertical: 'top',
	},
	error: {
		fontSize: 14,
		marginTop: 8,
	},
	buttons: {
		flexDirection: 'row',
		gap: 12,
		marginTop: 16,
	},
	button: {
		flex: 1,
		padding: 12,
		borderRadius: 8,
		alignItems: 'center',
	},
	buttonText: {
		fontSize: 16,
		fontWeight: '600',
	},
	cancelButton: {},
	createButton: {},
});
