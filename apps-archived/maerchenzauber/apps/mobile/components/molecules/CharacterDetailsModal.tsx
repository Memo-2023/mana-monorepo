// Firebase functionality temporarily disabled - see dataService.ts for placeholders
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Pressable, ScrollView } from 'react-native';
import Text from '../atoms/Text';
import TextField from '../atoms/TextField';
import Button from '../atoms/Button';
import { Picker } from '@react-native-picker/picker';
import type { Character } from '../../types/character';
import { Ionicons } from '@expo/vector-icons';

const ETHNICITIES = ['Hispanic', 'Black', 'White', 'Asian', 'Middle Eastern', 'Other'] as const;

const GENDER_MAPPING = {
	male: 'Männlich',
	female: 'Weiblich',
	other: 'Divers',
} as const;

const GENDERS = ['male', 'female', 'other'] as const;

// Generiere Altersliste von 1 bis 18
const AGES = Array.from({ length: 18 }, (_, i) => i + 1);

interface CharacterDetailsModalProps {
	character: Character;
	characterId: string;
	visible: boolean;
	onClose: () => void;
	onUpdate: (updatedCharacter: Character) => void;
}

export default function CharacterDetailsModal({
	character,
	characterId,
	visible,
	onClose,
	onUpdate,
}: CharacterDetailsModalProps) {
	const [editedCharacter, setEditedCharacter] = useState<Character>(character);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		setEditedCharacter(character);
	}, [character]);

	const handleSave = async () => {
		try {
			setIsLoading(true);
			const user = auth.currentUser;
			if (!user) {
				throw new Error('Nicht authentifiziert');
			}

			const characterRef = doc(db, 'users', user.uid, 'characters', characterId);
			await updateDoc(characterRef, editedCharacter);

			onUpdate(editedCharacter);
			onClose();
		} catch (error) {
			console.error('Error updating character:', error);
			// TODO: Add error handling UI
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
			<Pressable style={styles.modalOverlay} onPress={onClose}>
				<Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
					<View style={styles.modalHeader}>
						<Text style={styles.modalTitle}>Character bearbeiten</Text>
						<TouchableOpacity onPress={onClose} style={styles.closeButton}>
							<Ionicons name="close" size={24} color="#ffffff" />
						</TouchableOpacity>
					</View>

					<ScrollView style={styles.scrollView}>
						<View style={styles.inputContainer}>
							<Text style={styles.label}>Name:</Text>
							<TextField
								placeholder="Name des Charakters"
								value={editedCharacter.name}
								onChangeText={(value) => setEditedCharacter((prev) => ({ ...prev, name: value }))}
								style={styles.input}
								placeholderTextColor="#666666"
							/>
						</View>

						<View style={styles.pickerContainer}>
							<Text style={styles.label}>Alter:</Text>
							<Picker
								selectedValue={editedCharacter.age}
								onValueChange={(value) => setEditedCharacter((prev) => ({ ...prev, age: value }))}
								style={styles.picker}
								dropdownIconColor="#ffffff"
								itemStyle={styles.pickerItem}
							>
								{AGES.map((age) => (
									<Picker.Item key={age} label={age.toString()} value={age} color="#ffffff" />
								))}
							</Picker>
						</View>

						<View style={styles.pickerContainer}>
							<Text style={styles.label}>Geschlecht:</Text>
							<Picker
								selectedValue={editedCharacter.gender}
								onValueChange={(value) =>
									setEditedCharacter((prev) => ({ ...prev, gender: value }))
								}
								style={styles.picker}
								dropdownIconColor="#ffffff"
								itemStyle={styles.pickerItem}
							>
								{GENDERS.map((gender) => (
									<Picker.Item
										key={gender}
										label={GENDER_MAPPING[gender]}
										value={gender}
										color="#ffffff"
									/>
								))}
							</Picker>
						</View>

						<View style={styles.pickerContainer}>
							<Text style={styles.label}>Ethnische Zugehörigkeit:</Text>
							<Picker
								selectedValue={editedCharacter.ethnicity}
								onValueChange={(value) =>
									setEditedCharacter((prev) => ({ ...prev, ethnicity: value }))
								}
								style={styles.picker}
								dropdownIconColor="#ffffff"
								itemStyle={styles.pickerItem}
							>
								{ETHNICITIES.map((ethnicity) => (
									<Picker.Item
										key={ethnicity}
										label={ethnicity}
										value={ethnicity}
										color="#ffffff"
									/>
								))}
							</Picker>
						</View>

						<View style={styles.inputContainer}>
							<Text style={styles.label}>Haarfarbe:</Text>
							<TextField
								placeholder="z.B. Braun, Blond, Schwarz"
								value={editedCharacter.hairColor}
								onChangeText={(value) =>
									setEditedCharacter((prev) => ({ ...prev, hairColor: value }))
								}
								style={styles.input}
								placeholderTextColor="#666666"
							/>
						</View>

						<View style={styles.inputContainer}>
							<Text style={styles.label}>Augenfarbe:</Text>
							<TextField
								placeholder="z.B. Blau, Grün, Braun"
								value={editedCharacter.eyeColor}
								onChangeText={(value) =>
									setEditedCharacter((prev) => ({ ...prev, eyeColor: value }))
								}
								style={styles.input}
								placeholderTextColor="#666666"
							/>
						</View>

						<View style={styles.inputContainer}>
							<Text style={styles.label}>Hautton:</Text>
							<TextField
								placeholder="z.B. Hell, Mittel, Dunkel"
								value={editedCharacter.skinTone}
								onChangeText={(value) =>
									setEditedCharacter((prev) => ({ ...prev, skinTone: value }))
								}
								style={styles.input}
								placeholderTextColor="#666666"
							/>
						</View>
					</ScrollView>

					<View style={styles.buttonContainer}>
						<Button
							title={isLoading ? 'Wird gespeichert...' : 'Speichern'}
							onPress={handleSave}
							disabled={isLoading}
							style={styles.saveButton}
						/>
					</View>
				</Pressable>
			</Pressable>
		</Modal>
	);
}

const styles = StyleSheet.create({
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.75)',
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	modalContent: {
		backgroundColor: '#333333',
		borderRadius: 16,
		width: '100%',
		maxWidth: 400,
		maxHeight: '90%',
		padding: 24,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 24,
	},
	modalTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#ffffff',
	},
	closeButton: {
		padding: 8,
		marginRight: -8,
		marginTop: -8,
	},
	scrollView: {
		marginBottom: 16,
	},
	inputContainer: {
		marginBottom: 16,
	},
	label: {
		fontSize: 16,
		color: '#999999',
		marginBottom: 8,
	},
	input: {
		backgroundColor: '#444444',
		borderRadius: 8,
		padding: 12,
		color: '#ffffff',
		fontSize: 16,
	},
	pickerContainer: {
		marginBottom: 16,
	},
	picker: {
		backgroundColor: '#444444',
		color: '#ffffff',
	},
	pickerItem: {
		color: '#ffffff',
	},
	buttonContainer: {
		marginTop: 8,
	},
	saveButton: {
		backgroundColor: '#2196F3',
	},
});
