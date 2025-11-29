import React, { useState, useEffect } from 'react';
import {
	View,
	StyleSheet,
	Alert,
	FlatList,
	TouchableOpacity,
	Modal,
	TextInput,
	ScrollView,
	ActivityIndicator,
	KeyboardAvoidingView,
	Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import CommonHeader from '../components/molecules/CommonHeader';
import Text from '../components/atoms/Text';
import Button from '../components/atoms/Button';
import Avatar from '../components/atoms/Avatar';
import { fetchWithAuth } from '../src/utils/api';

interface Creator {
	id: string;
	creator_id: string;
	name: string;
	type: 'author' | 'illustrator';
	description: string;
	system_prompt: string;
	profile_picture?: string;
	extra_prompt_beginning?: string;
	extra_prompt_end?: string;
	created_at?: string;
	updated_at?: string;
}

interface CreatorFormData {
	name: string;
	type: 'author' | 'illustrator';
	description: string;
	systemPrompt: string;
	profilePicture?: string;
	extraPromptBeginning?: string;
	extraPromptEnd?: string;
}

export default function CreatorManagement() {
	const [creators, setCreators] = useState<Creator[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [selectedTab, setSelectedTab] = useState<'author' | 'illustrator'>('author');
	const [showFormModal, setShowFormModal] = useState(false);
	const [editingCreator, setEditingCreator] = useState<Creator | null>(null);

	// Form states
	const [formData, setFormData] = useState<CreatorFormData>({
		name: '',
		type: 'author',
		description: '',
		systemPrompt: '',
		profilePicture: '',
		extraPromptBeginning: '',
		extraPromptEnd: '',
	});

	useEffect(() => {
		loadCreators();
	}, []);

	const loadCreators = async () => {
		try {
			setLoading(true);
			const response = await fetchWithAuth('/creators');

			if (!response.ok) {
				throw new Error('Failed to fetch creators');
			}

			const data = await response.json();
			setCreators(data.creators || []);
		} catch (error) {
			console.error('Error loading creators:', error);
			Alert.alert('Fehler', 'Creators konnten nicht geladen werden');
		} finally {
			setLoading(false);
		}
	};

	const handleCreateOrUpdate = async () => {
		// Validation
		if (!formData.name.trim() || formData.name.length < 2) {
			Alert.alert('Fehler', 'Name muss mindestens 2 Zeichen lang sein');
			return;
		}

		if (!formData.description.trim()) {
			Alert.alert('Fehler', 'Beschreibung ist erforderlich');
			return;
		}

		if (!formData.systemPrompt.trim() || formData.systemPrompt.length < 50) {
			Alert.alert('Fehler', 'System Prompt muss mindestens 50 Zeichen lang sein');
			return;
		}

		try {
			setSaving(true);

			const url = editingCreator ? `/creators/${editingCreator.id}` : '/creators';

			const method = editingCreator ? 'PUT' : 'POST';

			const response = await fetchWithAuth(url, {
				method,
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(formData),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Fehler beim Speichern');
			}

			Alert.alert('Erfolg', editingCreator ? 'Creator aktualisiert' : 'Creator erstellt');

			setShowFormModal(false);
			resetForm();
			loadCreators();
		} catch (error) {
			console.error('Error saving creator:', error);
			Alert.alert('Fehler', 'Creator konnte nicht gespeichert werden');
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async (creator: Creator) => {
		Alert.alert('Creator löschen', `Möchtest du "${creator.name}" wirklich löschen?`, [
			{ text: 'Abbrechen', style: 'cancel' },
			{
				text: 'Löschen',
				style: 'destructive',
				onPress: async () => {
					try {
						const response = await fetchWithAuth(`/creators/${creator.id}`, {
							method: 'DELETE',
						});

						if (!response.ok) {
							throw new Error('Löschen fehlgeschlagen');
						}

						Alert.alert('Erfolg', 'Creator gelöscht');
						loadCreators();
					} catch (error) {
						console.error('Error deleting creator:', error);
						Alert.alert('Fehler', 'Creator konnte nicht gelöscht werden');
					}
				},
			},
		]);
	};

	const handleEdit = (creator: Creator) => {
		setEditingCreator(creator);
		setFormData({
			name: creator.name,
			type: creator.type,
			description: creator.description,
			systemPrompt: creator.system_prompt,
			profilePicture: creator.profile_picture || '',
			extraPromptBeginning: creator.extra_prompt_beginning || '',
			extraPromptEnd: creator.extra_prompt_end || '',
		});
		setShowFormModal(true);
	};

	const resetForm = () => {
		setEditingCreator(null);
		setFormData({
			name: '',
			type: selectedTab,
			description: '',
			systemPrompt: '',
			profilePicture: '',
			extraPromptBeginning: '',
			extraPromptEnd: '',
		});
	};

	const openCreateForm = () => {
		resetForm();
		setFormData((prev) => ({ ...prev, type: selectedTab }));
		setShowFormModal(true);
	};

	const filteredCreators = creators.filter((c) => c.type === selectedTab);

	const renderCreatorItem = ({ item }: { item: Creator }) => (
		<View style={styles.creatorCard}>
			<View style={styles.creatorHeader}>
				<Avatar imageUrl={item.profile_picture} name={item.name} size={60} showName={false} />
				<View style={styles.creatorInfo}>
					<Text style={styles.creatorName}>{item.name}</Text>
					<Text style={styles.creatorDescription} numberOfLines={2}>
						{item.description}
					</Text>
				</View>
			</View>

			<View style={styles.creatorActions}>
				<TouchableOpacity style={styles.actionButton} onPress={() => handleEdit(item)}>
					<Ionicons name="pencil" size={20} color="#4CAF50" />
				</TouchableOpacity>
				<TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item)}>
					<Ionicons name="trash" size={20} color="#F44336" />
				</TouchableOpacity>
			</View>
		</View>
	);

	if (loading) {
		return (
			<SafeAreaView style={styles.safeArea} edges={['top']}>
				<CommonHeader title="Creator Verwaltung" />
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#FFD700" />
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<CommonHeader title="Creator Verwaltung" />

			<View style={styles.container}>
				{/* Tab Navigation */}
				<View style={styles.tabContainer}>
					<TouchableOpacity
						style={[styles.tab, selectedTab === 'author' && styles.activeTab]}
						onPress={() => setSelectedTab('author')}
					>
						<Text style={[styles.tabText, selectedTab === 'author' && styles.activeTabText]}>
							Autoren ({creators.filter((c) => c.type === 'author').length})
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.tab, selectedTab === 'illustrator' && styles.activeTab]}
						onPress={() => setSelectedTab('illustrator')}
					>
						<Text style={[styles.tabText, selectedTab === 'illustrator' && styles.activeTabText]}>
							Illustratoren ({creators.filter((c) => c.type === 'illustrator').length})
						</Text>
					</TouchableOpacity>
				</View>

				{/* Create Button */}
				<TouchableOpacity style={styles.createButton} onPress={openCreateForm}>
					<Ionicons name="add-circle" size={24} color="#fff" />
					<Text style={styles.createButtonText}>
						Neuer {selectedTab === 'author' ? 'Autor' : 'Illustrator'}
					</Text>
				</TouchableOpacity>

				{/* Creators List */}
				<FlatList
					data={filteredCreators}
					renderItem={renderCreatorItem}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.listContent}
					ListEmptyComponent={
						<View style={styles.emptyContainer}>
							<Text style={styles.emptyText}>
								Keine {selectedTab === 'author' ? 'Autoren' : 'Illustratoren'} vorhanden
							</Text>
						</View>
					}
				/>
			</View>

			{/* Form Modal */}
			<Modal
				visible={showFormModal}
				animationType="slide"
				transparent={true}
				onRequestClose={() => setShowFormModal(false)}
			>
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
					style={styles.modalContainer}
				>
					<View style={styles.modalContent}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>
								{editingCreator ? 'Creator bearbeiten' : 'Neuer Creator'}
							</Text>
							<TouchableOpacity onPress={() => setShowFormModal(false)}>
								<Ionicons name="close" size={24} color="#fff" />
							</TouchableOpacity>
						</View>

						<ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
							{/* Name */}
							<View style={styles.formGroup}>
								<Text style={styles.formLabel}>Name *</Text>
								<TextInput
									style={styles.input}
									value={formData.name}
									onChangeText={(text) => setFormData((prev) => ({ ...prev, name: text }))}
									placeholder="z.B. Märchen Marie"
									placeholderTextColor="#666"
									maxLength={50}
								/>
							</View>

							{/* Type */}
							<View style={styles.formGroup}>
								<Text style={styles.formLabel}>Typ *</Text>
								<View style={styles.typeSelector}>
									<TouchableOpacity
										style={[
											styles.typeButton,
											formData.type === 'author' && styles.typeButtonActive,
										]}
										onPress={() => setFormData((prev) => ({ ...prev, type: 'author' }))}
									>
										<Text
											style={[
												styles.typeButtonText,
												formData.type === 'author' && styles.typeButtonTextActive,
											]}
										>
											Autor
										</Text>
									</TouchableOpacity>
									<TouchableOpacity
										style={[
											styles.typeButton,
											formData.type === 'illustrator' && styles.typeButtonActive,
										]}
										onPress={() => setFormData((prev) => ({ ...prev, type: 'illustrator' }))}
									>
										<Text
											style={[
												styles.typeButtonText,
												formData.type === 'illustrator' && styles.typeButtonTextActive,
											]}
										>
											Illustrator
										</Text>
									</TouchableOpacity>
								</View>
							</View>

							{/* Description */}
							<View style={styles.formGroup}>
								<Text style={styles.formLabel}>Beschreibung *</Text>
								<TextInput
									style={[styles.input, styles.textArea]}
									value={formData.description}
									onChangeText={(text) => setFormData((prev) => ({ ...prev, description: text }))}
									placeholder="Kurze Beschreibung des Creators"
									placeholderTextColor="#666"
									multiline
									numberOfLines={3}
									maxLength={200}
								/>
							</View>

							{/* System Prompt */}
							<View style={styles.formGroup}>
								<Text style={styles.formLabel}>System Prompt * (min. 50 Zeichen)</Text>
								<TextInput
									style={[styles.input, styles.textAreaLarge]}
									value={formData.systemPrompt}
									onChangeText={(text) => setFormData((prev) => ({ ...prev, systemPrompt: text }))}
									placeholder={
										formData.type === 'author'
											? 'Du bist ein kreativer Geschichtenerzähler...'
											: 'Du bist ein talentierter Illustrator...'
									}
									placeholderTextColor="#666"
									multiline
									numberOfLines={5}
									maxLength={1000}
								/>
								<Text style={styles.charCount}>{formData.systemPrompt.length}/1000</Text>
							</View>

							{/* Extra Prompt Beginning */}
							<View style={styles.formGroup}>
								<Text style={styles.formLabel}>Prompt Anfang (optional)</Text>
								<TextInput
									style={[styles.input, styles.textArea]}
									value={formData.extraPromptBeginning}
									onChangeText={(text) =>
										setFormData((prev) => ({ ...prev, extraPromptBeginning: text }))
									}
									placeholder="Text der vor jeden Prompt kommt"
									placeholderTextColor="#666"
									multiline
									numberOfLines={2}
								/>
							</View>

							{/* Extra Prompt End */}
							<View style={styles.formGroup}>
								<Text style={styles.formLabel}>Prompt Ende (optional)</Text>
								<TextInput
									style={[styles.input, styles.textArea]}
									value={formData.extraPromptEnd}
									onChangeText={(text) =>
										setFormData((prev) => ({ ...prev, extraPromptEnd: text }))
									}
									placeholder="Text der nach jeden Prompt kommt"
									placeholderTextColor="#666"
									multiline
									numberOfLines={2}
								/>
							</View>

							{/* Profile Picture URL */}
							<View style={styles.formGroup}>
								<Text style={styles.formLabel}>Profilbild URL (optional)</Text>
								<TextInput
									style={styles.input}
									value={formData.profilePicture}
									onChangeText={(text) =>
										setFormData((prev) => ({ ...prev, profilePicture: text }))
									}
									placeholder="https://..."
									placeholderTextColor="#666"
									autoCapitalize="none"
								/>
							</View>
						</ScrollView>

						{/* Form Actions */}
						<View style={styles.formActions}>
							<Button
								title="Abbrechen"
								onPress={() => setShowFormModal(false)}
								color="#666"
								variant="secondary"
								style={{ flex: 1, marginRight: 8 }}
							/>
							<Button
								title={saving ? 'Speichern...' : 'Speichern'}
								onPress={handleCreateOrUpdate}
								color="#4CAF50"
								variant="primary"
								style={{ flex: 1, marginLeft: 8 }}
								disabled={saving}
							/>
						</View>
					</View>
				</KeyboardAvoidingView>
			</Modal>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#181818',
	},
	container: {
		flex: 1,
		paddingTop: 100,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	tabContainer: {
		flexDirection: 'row',
		paddingHorizontal: 20,
		marginBottom: 20,
	},
	tab: {
		flex: 1,
		paddingVertical: 12,
		alignItems: 'center',
		borderBottomWidth: 2,
		borderBottomColor: 'transparent',
	},
	activeTab: {
		borderBottomColor: '#FFD700',
	},
	tabText: {
		color: '#999',
		fontSize: 16,
	},
	activeTabText: {
		color: '#FFD700',
		fontWeight: 'bold',
	},
	createButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#4CAF50',
		marginHorizontal: 20,
		marginBottom: 20,
		padding: 12,
		borderRadius: 8,
		justifyContent: 'center',
	},
	createButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
		marginLeft: 8,
	},
	listContent: {
		paddingHorizontal: 20,
		paddingBottom: 20,
	},
	creatorCard: {
		backgroundColor: '#2C2C2C',
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
	},
	creatorHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
	},
	creatorInfo: {
		flex: 1,
		marginLeft: 12,
	},
	creatorName: {
		color: '#fff',
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	creatorDescription: {
		color: '#999',
		fontSize: 14,
	},
	creatorActions: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		gap: 12,
	},
	actionButton: {
		padding: 8,
		backgroundColor: '#333',
		borderRadius: 8,
	},
	emptyContainer: {
		padding: 40,
		alignItems: 'center',
	},
	emptyText: {
		color: '#999',
		fontSize: 16,
	},
	modalContainer: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.8)',
		justifyContent: 'center',
	},
	modalContent: {
		backgroundColor: '#222',
		marginHorizontal: 20,
		borderRadius: 12,
		maxHeight: '90%',
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 20,
		borderBottomWidth: 1,
		borderBottomColor: '#333',
	},
	modalTitle: {
		color: '#fff',
		fontSize: 20,
		fontWeight: 'bold',
	},
	formScroll: {
		padding: 20,
	},
	formGroup: {
		marginBottom: 20,
	},
	formLabel: {
		color: '#fff',
		fontSize: 14,
		marginBottom: 8,
	},
	input: {
		backgroundColor: '#333',
		color: '#fff',
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
	},
	textArea: {
		minHeight: 80,
		textAlignVertical: 'top',
	},
	textAreaLarge: {
		minHeight: 120,
		textAlignVertical: 'top',
	},
	charCount: {
		color: '#666',
		fontSize: 12,
		marginTop: 4,
		textAlign: 'right',
	},
	typeSelector: {
		flexDirection: 'row',
		gap: 12,
	},
	typeButton: {
		flex: 1,
		padding: 12,
		borderRadius: 8,
		backgroundColor: '#333',
		alignItems: 'center',
	},
	typeButtonActive: {
		backgroundColor: '#FFD700',
	},
	typeButtonText: {
		color: '#999',
		fontSize: 16,
	},
	typeButtonTextActive: {
		color: '#000',
		fontWeight: 'bold',
	},
	formActions: {
		flexDirection: 'row',
		padding: 20,
		borderTopWidth: 1,
		borderTopColor: '#333',
	},
});
