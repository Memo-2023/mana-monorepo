import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	TextInput,
	SafeAreaView,
	Alert,
	ActivityIndicator,
	ScrollView,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthProvider';
import { createSpace } from '../../services/space';

export default function NewSpaceScreen() {
	const { colors } = useTheme();
	const router = useRouter();
	const { user } = useAuth();
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [isCreating, setIsCreating] = useState(false);

	// Validieren der Eingaben
	const isValid = name.trim().length > 0;

	// Erstellen eines neuen Spaces
	const handleCreateSpace = async () => {
		if (!isValid || !user) return;

		setIsCreating(true);
		try {
			const spaceId = await createSpace(user.id, name.trim(), description.trim() || undefined);

			if (spaceId) {
				// Navigation zum neuen Space
				Alert.alert('Erfolg', 'Space wurde erfolgreich erstellt.', [
					{
						text: 'OK',
						onPress: () => router.push(`/spaces/${spaceId}`),
					},
				]);
			} else {
				Alert.alert('Fehler', 'Der Space konnte nicht erstellt werden.');
			}
		} catch (error) {
			console.error('Fehler beim Erstellen des Spaces:', error);
			Alert.alert('Fehler', 'Der Space konnte nicht erstellt werden.');
		} finally {
			setIsCreating(false);
		}
	};

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
			<View style={styles.header}>
				<TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
					<Ionicons name="chevron-back" size={24} color={colors.text} />
				</TouchableOpacity>
				<Text style={[styles.headerTitle, { color: colors.text }]}>Neuen Space erstellen</Text>
			</View>

			<ScrollView style={styles.contentContainer} contentContainerStyle={styles.scrollContent}>
				<View style={styles.formSection}>
					<Text style={[styles.label, { color: colors.text }]}>Name *</Text>
					<TextInput
						style={[
							styles.input,
							{
								backgroundColor: colors.card,
								borderColor: colors.border,
								color: colors.text,
							},
						]}
						placeholder="Name des Spaces"
						placeholderTextColor={colors.text + '70'}
						value={name}
						onChangeText={setName}
						maxLength={50}
					/>

					<Text style={[styles.label, { color: colors.text, marginTop: 20 }]}>Beschreibung</Text>
					<TextInput
						style={[
							styles.textArea,
							{
								backgroundColor: colors.card,
								borderColor: colors.border,
								color: colors.text,
							},
						]}
						placeholder="Beschreibung des Spaces (optional)"
						placeholderTextColor={colors.text + '70'}
						value={description}
						onChangeText={setDescription}
						multiline
						numberOfLines={4}
						maxLength={500}
						textAlignVertical="top"
					/>
				</View>

				<View style={styles.infoSection}>
					<View style={styles.infoItem}>
						<Ionicons
							name="information-circle-outline"
							size={20}
							color={colors.text + '80'}
							style={styles.infoIcon}
						/>
						<Text style={[styles.infoText, { color: colors.text + '80' }]}>
							Spaces sind Bereiche zum Organisieren von Konversationen und können mit anderen
							Nutzern geteilt werden.
						</Text>
					</View>
				</View>
			</ScrollView>

			<View style={[styles.footer, { borderTopColor: colors.border }]}>
				<TouchableOpacity
					style={[
						styles.createButton,
						{
							backgroundColor: isValid ? colors.primary : colors.primary + '50',
							opacity: isCreating ? 0.7 : 1,
						},
					]}
					onPress={handleCreateSpace}
					disabled={!isValid || isCreating}
				>
					{isCreating ? (
						<ActivityIndicator size="small" color="white" />
					) : (
						<Text style={styles.createButtonText}>Space erstellen</Text>
					)}
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	backButton: {
		padding: 8,
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginLeft: 8,
	},
	contentContainer: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: 20,
		paddingTop: 20,
		paddingBottom: 40,
	},
	formSection: {
		marginBottom: 30,
	},
	label: {
		fontSize: 16,
		fontWeight: '500',
		marginBottom: 8,
	},
	input: {
		borderWidth: 1,
		borderRadius: 10,
		paddingHorizontal: 16,
		paddingVertical: 12,
		fontSize: 16,
	},
	textArea: {
		borderWidth: 1,
		borderRadius: 10,
		paddingHorizontal: 16,
		paddingVertical: 12,
		fontSize: 16,
		minHeight: 120,
	},
	infoSection: {
		marginBottom: 20,
	},
	infoItem: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		marginBottom: 12,
	},
	infoIcon: {
		marginRight: 8,
		marginTop: 2,
	},
	infoText: {
		fontSize: 14,
		flex: 1,
		lineHeight: 20,
	},
	footer: {
		borderTopWidth: 1,
		paddingHorizontal: 20,
		paddingVertical: 16,
	},
	createButton: {
		paddingVertical: 14,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
	},
	createButtonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: 'bold',
	},
});
