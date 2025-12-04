import React, { useState } from 'react';
import {
	View,
	TextInput,
	TouchableOpacity,
	Text,
	StyleSheet,
	ScrollView,
	Alert,
	Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { storage } from '../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { createSlide, updateSlide } from '../../services/firestore';
import { Slide } from '../../types/models';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../ThemeProvider';

interface SlideEditorProps {
	deckId: string;
	slide?: Slide;
	onSuccess?: () => void;
	onCancel?: () => void;
}

export const SlideEditor: React.FC<SlideEditorProps> = ({ deckId, slide, onSuccess, onCancel }) => {
	const { theme } = useTheme();
	const [title, setTitle] = useState(slide?.title ?? '');
	const [fullText, setFullText] = useState(slide?.fullText ?? '');
	const [bulletPoints, setBulletPoints] = useState<string[]>(slide?.bulletPoints ?? ['']);
	const [notes, setNotes] = useState(slide?.notes ?? '');
	const [imageUrl, setImageUrl] = useState(slide?.imageUrl);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const handleAddBulletPoint = () => {
		setBulletPoints([...bulletPoints, '']);
	};

	const handleUpdateBulletPoint = (index: number, text: string) => {
		const newBulletPoints = [...bulletPoints];
		newBulletPoints[index] = text;
		setBulletPoints(newBulletPoints);
	};

	const handleRemoveBulletPoint = (index: number) => {
		const newBulletPoints = bulletPoints.filter((_, i) => i !== index);
		setBulletPoints(newBulletPoints);
	};

	const handlePickImage = async () => {
		const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

		if (permissionResult.granted === false) {
			Alert.alert('Permission Required', 'Please allow access to your photos to upload images.');
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [16, 9],
			quality: 1,
		});

		if (!result.canceled) {
			const uri = result.assets[0].uri;
			setImageUrl(uri);
		}
	};

	const handleSubmit = async () => {
		if (isSubmitting) return;

		setIsSubmitting(true);
		try {
			let uploadedImageUrl = imageUrl;

			// Upload image if selected
			if (imageUrl && imageUrl.startsWith('file://')) {
				const response = await fetch(imageUrl);
				const blob = await response.blob();
				const imagePath = `slides/${deckId}/${Date.now()}.jpg`;
				const imageRef = ref(storage, imagePath);
				await uploadBytes(imageRef, blob);
				uploadedImageUrl = await getDownloadURL(imageRef);
			}

			// Create or update slide
			const slideData = {
				deckId,
				title,
				fullText,
				bulletPoints: bulletPoints.filter((bp) => bp.trim() !== ''),
				notes,
				imageUrl: uploadedImageUrl,
			};

			if (slide?.id) {
				// Update existing slide
				await updateSlide(slide.id, slideData);
			} else {
				// Create new slide
				const newSlide = await createSlide(slideData);
				console.log('[SlideEditor] Slide created successfully:', newSlide);
			}

			onSuccess?.();
		} catch (error) {
			console.error('[SlideEditor] Error saving slide:', error);
			Alert.alert('Error', 'Failed to save slide. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<View style={[styles.editorContainer, { backgroundColor: theme.colors.backgroundPrimary }]}>
			<ScrollView style={{ flex: 1, padding: 16 }}>
				<View style={styles.formGroup}>
					<Text style={[styles.label, { color: theme.colors.textPrimary }]}>Title</Text>
					<TextInput
						style={[
							styles.input,
							{
								backgroundColor: theme.colors.backgroundSecondary,
								color: theme.colors.textPrimary,
								borderColor: theme.colors.borderPrimary,
							},
						]}
						value={title}
						onChangeText={setTitle}
						placeholder="Enter slide title"
						placeholderTextColor={theme.colors.textSecondary}
					/>
				</View>

				<View style={styles.inputContainer}>
					<Text style={[styles.label, { color: theme.colors.textSecondary }]}>Image</Text>
					<TouchableOpacity
						style={[
							styles.imagePreview,
							{
								backgroundColor: theme.colors.backgroundSecondary,
								borderColor: theme.colors.border,
							},
						]}
						onPress={handlePickImage}
					>
						{imageUrl ? (
							<Image source={{ uri: imageUrl }} style={styles.imagePreview} resizeMode="cover" />
						) : (
							<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
								<MaterialIcons name="add-photo-alternate" size={32} color={theme.colors.primary} />
								<Text style={[styles.addButtonText, { color: theme.colors.primary }]}>
									Add Image
								</Text>
							</View>
						)}
					</TouchableOpacity>
				</View>

				<View style={styles.inputContainer}>
					<Text style={[styles.label, { color: theme.colors.textSecondary }]}>Full Text</Text>
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
						value={fullText}
						onChangeText={setFullText}
						placeholder="Enter full text content..."
						placeholderTextColor={theme.colors.textTertiary}
						multiline
					/>
				</View>

				<View style={styles.inputContainer}>
					<Text style={[styles.label, { color: theme.colors.textSecondary }]}>Bullet Points</Text>
					{bulletPoints.map((point, index) => (
						<View key={index} style={styles.bulletPointContainer}>
							<MaterialIcons
								name="circle"
								size={8}
								color={theme.colors.textSecondary}
								style={{ marginRight: 8 }}
							/>
							<TextInput
								style={[
									styles.input,
									styles.bulletPointInput,
									{
										backgroundColor: theme.colors.backgroundSecondary,
										color: theme.colors.textPrimary,
										borderColor: theme.colors.border,
									},
								]}
								value={point}
								onChangeText={(text) => handleUpdateBulletPoint(index, text)}
								placeholder="Add bullet point..."
								placeholderTextColor={theme.colors.textTertiary}
								multiline
							/>
							<TouchableOpacity
								style={{ padding: 4 }}
								onPress={() => handleRemoveBulletPoint(index)}
							>
								<MaterialIcons name="remove-circle-outline" size={20} color={theme.colors.error} />
							</TouchableOpacity>
						</View>
					))}
					<TouchableOpacity style={styles.addButton} onPress={handleAddBulletPoint}>
						<MaterialIcons name="add-circle-outline" size={20} color={theme.colors.primary} />
						<Text style={[styles.addButtonText, { color: theme.colors.primary }]}>
							Add Bullet Point
						</Text>
					</TouchableOpacity>
				</View>

				<View style={styles.formGroup}>
					<Text style={[styles.label, { color: theme.colors.textPrimary }]}>Notes</Text>
					<TextInput
						style={[
							styles.input,
							styles.textArea,
							{
								backgroundColor: theme.colors.backgroundSecondary,
								color: theme.colors.textPrimary,
								borderColor: theme.colors.borderPrimary,
							},
						]}
						value={notes}
						onChangeText={setNotes}
						placeholder="Add presenter notes"
						placeholderTextColor={theme.colors.textSecondary}
						multiline
					/>
				</View>
			</ScrollView>

			<View style={styles.buttonContainer}>
				<TouchableOpacity
					style={[styles.button, { backgroundColor: theme.colors.backgroundSecondary }]}
					onPress={onCancel}
				>
					<Text style={[styles.buttonText, { color: theme.colors.textPrimary }]}>Cancel</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[styles.button, { backgroundColor: theme.colors.primary }]}
					onPress={handleSubmit}
					disabled={isSubmitting}
				>
					<Text style={[styles.buttonText, { color: theme.colors.textOnPrimary }]}>
						{isSubmitting ? 'Saving...' : 'Save'}
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	editorContainer: {
		flex: 1,
	},
	formGroup: {
		marginBottom: 16,
	},
	inputContainer: {
		marginBottom: 16,
	},
	label: {
		fontSize: 14,
		marginBottom: 4,
		fontWeight: '500',
	},
	input: {
		borderWidth: 1,
		borderRadius: 8,
		padding: 12,
		fontSize: 14,
	},
	textArea: {
		height: 100,
		textAlignVertical: 'top',
	},
	bulletPointContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
	},
	bulletPointInput: {
		flex: 1,
		marginRight: 8,
	},
	addButton: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 8,
		borderRadius: 8,
		marginTop: 8,
	},
	addButtonText: {
		marginLeft: 8,
		fontSize: 14,
		fontWeight: '500',
	},
	buttonContainer: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		gap: 8,
		marginTop: 16,
	},
	button: {
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 8,
		minWidth: 80,
		alignItems: 'center',
	},
	buttonText: {
		fontSize: 14,
		fontWeight: '500',
	},
	imagePreview: {
		width: '100%',
		height: 200,
		marginTop: 8,
		borderRadius: 8,
	},
});
