import React, { useState } from 'react';
import { StyleSheet, Pressable, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../atoms/Text';
import Button from '../atoms/Button';
import Modal from '../atoms/Modal';
import { dataService } from '../../src/utils/dataService';
import Toast from 'react-native-toast-message';

interface PublishStoryButtonProps {
	storyId: string;
	storyTitle: string;
	isPublished?: boolean;
	sharingPreference?: 'private' | 'link_only' | 'public';
	shareCode?: string;
	onPublishChange?: (published: boolean, shareCode?: string) => void;
	size?: 'small' | 'medium' | 'large';
	color?: string;
}

const PublishStoryButton: React.FC<PublishStoryButtonProps> = ({
	storyId,
	storyTitle,
	isPublished = false,
	sharingPreference = 'private',
	shareCode,
	onPublishChange,
	size = 'medium',
	color = '#FFFFFF',
}) => {
	const [showModal, setShowModal] = useState(false);
	const [publishing, setPublishing] = useState(false);
	const [currentShareCode, setCurrentShareCode] = useState(shareCode);
	const [currentlyPublished, setCurrentlyPublished] = useState(isPublished);

	const sizeConfig = {
		small: { icon: 20, padding: 8 },
		medium: { icon: 24, padding: 10 },
		large: { icon: 32, padding: 12 },
	};

	const config = sizeConfig[size];

	const handlePublish = async (preference: 'private' | 'link_only' | 'public') => {
		setPublishing(true);
		try {
			const result = await dataService.publishStory(storyId, preference);

			if (result.data) {
				setCurrentShareCode(result.share_code);
				setCurrentlyPublished(preference !== 'private');
				onPublishChange?.(preference !== 'private', result.share_code);

				Toast.show({
					type: 'success',
					text1: '✨ Geschichte veröffentlicht!',
					text2: result.share_code ? `Share-Code: ${result.share_code}` : undefined,
					position: 'bottom',
					visibilityTime: 3000,
				});

				setShowModal(false);
			}
		} catch (error) {
			console.error('Error publishing story:', error);
			Alert.alert('Fehler', 'Geschichte konnte nicht veröffentlicht werden');
		} finally {
			setPublishing(false);
		}
	};

	const handleUnpublish = async () => {
		Alert.alert(
			'Geschichte zurückziehen',
			'Möchtest du diese Geschichte wirklich aus der Veröffentlichung zurückziehen?',
			[
				{ text: 'Abbrechen', style: 'cancel' },
				{
					text: 'Zurückziehen',
					style: 'destructive',
					onPress: async () => {
						setPublishing(true);
						try {
							const result = await dataService.unpublishStory(storyId);

							if (result.data) {
								setCurrentShareCode(undefined);
								setCurrentlyPublished(false);
								onPublishChange?.(false);

								Toast.show({
									type: 'success',
									text1: 'Geschichte zurückgezogen',
									position: 'bottom',
									visibilityTime: 2000,
								});

								setShowModal(false);
							}
						} catch (error) {
							console.error('Error unpublishing story:', error);
							Alert.alert('Fehler', 'Geschichte konnte nicht zurückgezogen werden');
						} finally {
							setPublishing(false);
						}
					},
				},
			]
		);
	};

	return (
		<>
			<Pressable
				onPress={() => setShowModal(true)}
				style={({ pressed }) => [
					styles.button,
					{ padding: config.padding },
					currentlyPublished && styles.publishedButton,
					pressed && styles.buttonPressed,
				]}
			>
				<Ionicons
					name={currentlyPublished ? 'cloud-done-outline' : 'cloud-upload-outline'}
					size={config.icon}
					color={currentlyPublished ? '#FFD700' : color}
				/>
			</Pressable>

			<Modal
				visible={showModal}
				onClose={() => setShowModal(false)}
				maxWidth={500}
				dismissOnBackgroundPress={true}
			>
				<View style={styles.modalHeader}>
					<Text variant="header" color="#fff" style={styles.modalTitle}>
						Geschichte veröffentlichen
					</Text>
					<Pressable onPress={() => setShowModal(false)} style={styles.closeButton}>
						<Ionicons name="close" size={24} color="#FFFFFF" />
					</Pressable>
				</View>

				{currentlyPublished && currentShareCode && (
					<View style={styles.shareCodeContainer}>
						<Text variant="caption" color="#999" style={styles.shareCodeLabel}>
							Share-Code:
						</Text>
						<Text variant="body" color="#FFD700" style={styles.shareCode}>
							{currentShareCode}
						</Text>
					</View>
				)}

				<View style={styles.optionsContainer}>
					<Pressable
						style={[styles.optionButton, sharingPreference === 'private' && styles.selectedOption]}
						onPress={() => handlePublish('private')}
						disabled={publishing}
					>
						<Ionicons name="lock-closed-outline" size={24} color="#FFFFFF" />
						<View style={styles.optionTextContainer}>
							<Text variant="body" color="#fff" style={styles.optionTitle}>
								Privat
							</Text>
							<Text variant="caption" color="#999" style={styles.optionDescription}>
								Nur für dich sichtbar
							</Text>
						</View>
					</Pressable>

					<Pressable
						style={[
							styles.optionButton,
							sharingPreference === 'link_only' && styles.selectedOption,
						]}
						onPress={() => handlePublish('link_only')}
						disabled={publishing}
					>
						<Ionicons name="link-outline" size={24} color="#FFFFFF" />
						<View style={styles.optionTextContainer}>
							<Text variant="body" color="#fff" style={styles.optionTitle}>
								Mit Link teilbar
							</Text>
							<Text variant="caption" color="#999" style={styles.optionDescription}>
								Nur mit Share-Code zugänglich
							</Text>
						</View>
					</Pressable>

					<Pressable
						style={[styles.optionButton, sharingPreference === 'public' && styles.selectedOption]}
						onPress={() => handlePublish('public')}
						disabled={publishing}
					>
						<Ionicons name="globe-outline" size={24} color="#FFFFFF" />
						<View style={styles.optionTextContainer}>
							<Text variant="body" color="#fff" style={styles.optionTitle}>
								Öffentlich
							</Text>
							<Text variant="caption" color="#999" style={styles.optionDescription}>
								In der Entdecken-Sektion sichtbar
							</Text>
						</View>
					</Pressable>
				</View>

				{currentlyPublished && (
					<Button
						title="Geschichte zurückziehen"
						onPress={handleUnpublish}
						variant="primary"
						size="lg"
						color="#ff4444"
						style={styles.unpublishButton}
						disabled={publishing}
					/>
				)}
			</Modal>
		</>
	);
};

const styles = StyleSheet.create({
	button: {
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
	},
	publishedButton: {
		backgroundColor: 'rgba(255, 215, 0, 0.2)',
	},
	buttonPressed: {
		opacity: 0.8,
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
		flex: 1,
	},
	closeButton: {
		width: 40,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 20,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
	},
	shareCodeContainer: {
		backgroundColor: 'rgba(255, 215, 0, 0.1)',
		padding: 16,
		borderRadius: 12,
		marginBottom: 20,
		borderWidth: 1,
		borderColor: 'rgba(255, 215, 0, 0.3)',
	},
	shareCodeLabel: {
		marginBottom: 4,
	},
	shareCode: {
		fontSize: 20,
		fontWeight: '700',
		letterSpacing: 2,
	},
	optionsContainer: {
		gap: 12,
		marginBottom: 20,
	},
	optionButton: {
		backgroundColor: 'rgba(255, 255, 255, 0.05)',
		padding: 16,
		borderRadius: 12,
		borderWidth: 2,
		borderColor: 'rgba(255, 255, 255, 0.1)',
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	selectedOption: {
		borderColor: '#FFD700',
		backgroundColor: 'rgba(255, 215, 0, 0.1)',
	},
	optionTextContainer: {
		flex: 1,
	},
	optionTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 4,
	},
	optionDescription: {
		fontSize: 13,
	},
	unpublishButton: {
		marginTop: 4,
		width: '100%',
	},
});

export default PublishStoryButton;
