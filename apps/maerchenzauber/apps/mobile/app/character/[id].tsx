import React, { useEffect, useState } from 'react';
import MagicalLoadingScreen from '../../components/molecules/MagicalLoadingScreen';
import Skeleton from '../../components/atoms/Skeleton';
import {
	View,
	StyleSheet,
	TouchableOpacity,
	Platform,
	useWindowDimensions,
	Dimensions,
	Alert,
	Modal,
	Clipboard,
	ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchWithAuth } from '../../src/utils/api';
import { dataService } from '../../src/utils/dataService';
import { useAuth } from '../../src/contexts/AuthContext';
import Text from '../../components/atoms/Text';
import { Image } from 'expo-image';
import { Blurhash } from 'react-native-blurhash';
import Button from '../../components/atoms/Button';
import TextField from '../../components/atoms/TextField';
import CommonHeader from '../../components/molecules/CommonHeader';
import { Ionicons, MaterialIcons, AntDesign } from '@expo/vector-icons';
import { useFirstVisit } from '../../hooks/useFirstVisit';
import { usePublicCharacters } from '../../hooks/usePublicCharacters';
import type { Character } from '../../types/character';
import Toast from 'react-native-toast-message';
import ShareCharacterButton from '../../components/character/ShareCharacterButton';

const useResponsiveLayout = () => {
	const { width: windowWidth, height: windowHeight } = useWindowDimensions();
	const isTablet = windowWidth >= 768 && windowWidth < 1400;
	const isDesktop = windowWidth >= 1400;
	const isLandscape = windowWidth > windowHeight;

	// Font sizes
	const sectionTitleSize = isTablet || isDesktop ? 26 : 18;
	const sectionInfoSize = isTablet || isDesktop ? 20 : 16;
	const infoIconSize = isTablet || isDesktop ? 32 : 24;
	const characterNameSize = isTablet || isDesktop ? 40 : 32;

	return {
		isTablet,
		isDesktop,
		isLandscape,
		windowWidth,
		sectionTitleSize,
		sectionInfoSize,
		infoIconSize,
		characterNameSize,
	};
};

const SectionHeader = ({
	title,
	showInfo,
	onToggleInfo,
	titleSize,
	iconSize,
}: {
	title: string;
	showInfo: boolean;
	onToggleInfo: () => void;
	titleSize: number;
	iconSize: number;
}) => (
	<View style={styles.sectionHeader}>
		<View style={styles.titleContainer}>
			<Text style={[styles.sectionTitle, { fontSize: titleSize }]}>{title}</Text>
			<TouchableOpacity onPress={onToggleInfo} style={styles.infoButton}>
				<MaterialIcons
					name={showInfo ? 'help' : 'help-outline'}
					size={iconSize}
					color={showInfo ? '#ffffff' : '#999999'}
				/>
			</TouchableOpacity>
		</View>
	</View>
);

export default function CharacterPage() {
	const { id } = useLocalSearchParams();
	const router = useRouter();
	const [character, setCharacter] = useState<Character | null>(null);
	const [loading, setLoading] = useState(true);
	const [showStoryInfo, setShowStoryInfo] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [editedName, setEditedName] = useState('');
	const [showSharingModal, setShowSharingModal] = useState(false);
	const [selectedSharingPreference, setSelectedSharingPreference] = useState<
		'private' | 'link_only' | 'public'
	>('private');
	const [imageLoaded, setImageLoaded] = useState(false);

	const { user } = useAuth();
	const { publishCharacter, unpublishCharacter } = usePublicCharacters();

	const {
		isTablet,
		isDesktop,
		sectionTitleSize,
		sectionInfoSize,
		infoIconSize,
		characterNameSize,
	} = useResponsiveLayout();

	// Calculate dynamic styles
	const dynamicStyles = {
		container: {
			maxWidth: isDesktop ? 800 : isTablet ? 700 : 600,
			width: '100%',
			paddingHorizontal: isTablet || isDesktop ? 40 : 16,
			alignSelf: 'center' as const,
		},
		characterImage: {
			width: isDesktop ? 300 : isTablet ? 280 : 240,
			height: isDesktop ? 300 : isTablet ? 280 : 240,
			borderRadius: isDesktop ? 150 : isTablet ? 140 : 120,
			alignSelf: 'center' as const,
			marginVertical: 20,
		},
		section: {
			width: '100%',
			marginTop: 24,
			marginBottom: 40,
			backgroundColor: 'rgba(255, 255, 255, 0.1)',
			borderRadius: 16,
			padding: isTablet || isDesktop ? 32 : 24,
		},
	};

	const { showAllTooltips } = useFirstVisit('characterDetail');

	useEffect(() => {
		if (showAllTooltips) {
			setShowStoryInfo(true);
		}
	}, [showAllTooltips]);
	const [storyText, setStoryText] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		const loadCharacter = async () => {
			try {
				if (!user) {
					console.error('User not authenticated');
					router.back();
					return;
				}

				const characterData = await dataService.getCharacterById(id as string);
				setCharacter(characterData);
				setEditedName(characterData.name);
			} catch (error) {
				console.error('Error loading character:', error);
				router.back();
			} finally {
				setLoading(false);
			}
		};

		loadCharacter();
	}, [id, user]);

	const handleSaveName = async () => {
		if (!editedName.trim()) {
			return;
		}

		try {
			if (!user || !character) {
				throw new Error('Nicht authentifiziert oder Character nicht geladen');
			}

			await dataService.updateCharacter(id as string, {
				name: editedName.trim(),
			});

			setCharacter((prev) => (prev ? { ...prev, name: editedName.trim() } : null));
			setIsEditing(false);
		} catch (error) {
			console.error('Error updating character name:', error);
			// TODO: Add error handling UI
		}
	};

	const handleShareCharacter = async () => {
		if (!character) return;

		setSelectedSharingPreference(character.sharing_preference || 'private');
		setShowSharingModal(true);
	};

	const handlePublishCharacter = async () => {
		if (!character) return;

		try {
			const result = await publishCharacter(character.id, selectedSharingPreference);
			if (result) {
				setCharacter((prev) =>
					prev
						? {
								...prev,
								sharing_preference: selectedSharingPreference,
								is_published: selectedSharingPreference !== 'private',
								share_code: result.share_code || prev.share_code,
							}
						: null
				);
				setShowSharingModal(false);

				if (selectedSharingPreference !== 'private') {
					Alert.alert(
						'Charakter veröffentlicht!',
						selectedSharingPreference === 'link_only'
							? 'Dein Charakter kann jetzt über den Share-Code geteilt werden.'
							: 'Dein Charakter ist jetzt öffentlich sichtbar.'
					);
				}
			}
		} catch (error) {
			console.error('Error publishing character:', error);
		}
	};

	const handleUnpublishCharacter = async () => {
		if (!character) return;

		try {
			const result = await unpublishCharacter(character.id);
			if (result) {
				setCharacter((prev) =>
					prev
						? {
								...prev,
								sharing_preference: 'private',
								is_published: false,
							}
						: null
				);
				setShowSharingModal(false);
				Alert.alert('Charakter zurückgezogen', 'Dein Charakter ist jetzt wieder privat.');
			}
		} catch (error) {
			console.error('Error unpublishing character:', error);
		}
	};

	const handleCopyShareCode = () => {
		if (character?.share_code) {
			Clipboard.setString(character.share_code);
			Alert.alert('Kopiert!', 'Share-Code wurde in die Zwischenablage kopiert.');
		}
	};

	const handleArchiveCharacter = async () => {
		try {
			if (!user || !character) {
				throw new Error('Nicht authentifiziert oder Character nicht geladen');
			}

			Alert.alert(
				'Charakter archivieren',
				`Möchtest du deinen Charakter ${character.name} wirklich archivieren? Er wird nicht gelöscht. Du findest dein Archiv in den Einstellungen.`,
				[
					{
						text: 'Abbrechen',
						style: 'cancel',
					},
					{
						text: 'Archivieren',
						style: 'destructive',
						onPress: async () => {
							await dataService.updateCharacter(id as string, {
								archived: true,
							});

							Toast.show({
								type: 'success',
								text1: '📦 Charakter archiviert!',
								position: 'top',
								topOffset: 60,
								visibilityTime: 2000,
							});

							// Navigate back after short delay
							setTimeout(() => {
								router.back();
							}, 500);
						},
					},
				]
			);
		} catch (error) {
			console.error('Error archiving character:', error);
			// TODO: Add error handling UI
		}
	};

	const handleCreateStory = async () => {
		if (!storyText.trim()) {
			return;
		}

		try {
			setIsSubmitting(true);
			if (!user) {
				throw new Error('Nicht authentifiziert');
			}

			// Call Story Creation API
			const response = await fetchWithAuth('/story/animal', {
				method: 'POST',
				body: JSON.stringify({
					storyDescription: storyText,
					characters: [character?.id],
				}),
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ message: 'Unbekannter Fehler' }));
				throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
			}

			setStoryText('');
			router.push('/');
		} catch (error) {
			console.error('Error creating story:', error);
			// TODO: Add error handling UI
		} finally {
			setIsSubmitting(false);
		}
	};

	if (loading || !character) {
		return (
			<SafeAreaView style={styles.safeArea} edges={['top']}>
				<CommonHeader title="Dein Charakter" showBackButton />
				<KeyboardAwareScrollView
					contentContainerStyle={styles.contentContainer}
					enableOnAndroid={true}
					enableAutomaticScroll={true}
					keyboardShouldPersistTaps="handled"
					extraScrollHeight={Platform.OS === 'ios' ? 120 : 40}
					keyboardOpeningTime={0}
				>
					<View style={styles.centeredWrapper}>
						<View style={dynamicStyles.container}>
							<View style={styles.characterHeader}>
								<Skeleton
									style={[
										styles.skeletonImage,
										{
											width: dynamicStyles.characterImage.width,
											height: dynamicStyles.characterImage.height,
											borderRadius: dynamicStyles.characterImage.borderRadius,
										},
									]}
								/>
								<Skeleton style={styles.skeletonText} />
								<Skeleton style={[styles.skeletonText, { width: '60%' }]} />
							</View>
						</View>
					</View>
				</KeyboardAwareScrollView>
			</SafeAreaView>
		);
	}

	if (isSubmitting) {
		return <MagicalLoadingScreen context="story" />;
	}

	// Check if this is a system character (read-only)
	const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
	const isSystemCharacter = character?.user_id === SYSTEM_USER_ID;

	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<CommonHeader title="Dein Charakter" showBackButton />
			<KeyboardAwareScrollView
				contentContainerStyle={styles.contentContainer}
				enableOnAndroid={true}
				enableAutomaticScroll={true}
				keyboardShouldPersistTaps="handled"
				extraScrollHeight={Platform.OS === 'ios' ? 120 : 40}
				keyboardOpeningTime={0}
			>
				<View style={styles.centeredWrapper}>
					<View style={dynamicStyles.container}>
						<View style={styles.characterHeader}>
							{/* BlurHash Placeholder */}
							{!imageLoaded && (
								<Blurhash
									blurhash={(character as any).blur_hash || 'LEHV6nWB2yk8pyo0adR*.7kCMdnj'}
									style={[styles.blurHashPlaceholder, dynamicStyles.characterImage]}
									resizeMode="cover"
								/>
							)}

							{/* Actual Image */}
							<Image
								source={{ uri: character.image_url || character.imageUrl }}
								style={[
									styles.characterImage,
									dynamicStyles.characterImage,
									!imageLoaded && styles.hiddenImage,
								]}
								contentFit="cover"
								transition={300}
								cachePolicy="memory-disk"
								onLoad={() => setImageLoaded(true)}
							/>
							{isEditing ? (
								<View style={styles.editNameContainer}>
									<TextField
										value={editedName}
										onChangeText={setEditedName}
										style={styles.nameInput}
										placeholderTextColor="#666666"
										variant="large"
									/>
									<View style={styles.editButtonsRow}>
										<Button
											title="Abbrechen"
											onPress={() => {
												setEditedName(character.name);
												setIsEditing(false);
											}}
											style={styles.cancelButton}
											variant="secondary"
											size="md"
											color="#333333"
											textStyle={{ color: '#ffffff' }}
											iconName="xmark"
											iconSet="sf-symbols"
											iconPosition="right"
										/>
										<Button
											title="Bestätigen"
											onPress={handleSaveName}
											style={styles.confirmButton}
											disabled={!editedName.trim()}
											variant="primary"
											size="md"
											iconName="checkmark"
											iconSet="sf-symbols"
											iconPosition="right"
										/>
									</View>
									<Button
										title="Charakter archivieren"
										onPress={handleArchiveCharacter}
										style={styles.archiveButton}
										variant="secondary"
										size="md"
										color="#333333"
										textStyle={{ color: '#ffffff' }}
										iconName="archivebox"
										iconSet="sf-symbols"
										iconPosition="right"
									/>
								</View>
							) : (
								<>
									<Text style={[styles.characterName, { fontSize: characterNameSize }]}>
										{character.name}
									</Text>
									{character.sharing_preference && character.sharing_preference !== 'private' && (
										<View style={styles.sharingStatusContainer}>
											<View style={styles.sharingBadge}>
												<Ionicons
													name={character.sharing_preference === 'public' ? 'globe' : 'link'}
													size={14}
													color="#FFD700"
												/>
												<Text style={styles.sharingBadgeText}>
													{character.sharing_preference === 'public'
														? 'Öffentlich'
														: 'Nur per Link'}
												</Text>
											</View>
											{character.share_code && (
												<TouchableOpacity
													onPress={handleCopyShareCode}
													style={styles.shareCodeContainer}
												>
													<Text style={styles.shareCodeText}>
														Code: {character.share_code.slice(0, 6)}
													</Text>
													<Ionicons name="copy-outline" size={14} color="#999999" />
												</TouchableOpacity>
											)}
										</View>
									)}
								</>
							)}
						</View>

						{/* Action Buttons Horizontal Scroller - Full Width */}
						{/* Hide edit/share buttons for system characters */}
						{!isEditing && !isSystemCharacter && (
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={styles.actionButtonsContainer}
								style={styles.actionButtonsScroller}
							>
								<View style={styles.shareButtonWrapper}>
									<ShareCharacterButton
										characterId={character.id}
										characterName={character.name}
										shareCode={character.share_code}
										onShareCodeGenerated={(newShareCode) => {
											// Update local character state when share code is generated
											setCharacter((prev) =>
												prev
													? {
															...prev,
															share_code: newShareCode,
														}
													: null
											);
										}}
									/>
								</View>

								<TouchableOpacity
									style={styles.actionButton}
									onPress={() => setIsEditing(!isEditing)}
								>
									<AntDesign name="edit" size={24} color="#4A90E2" />
									<Text style={styles.actionButtonText}>Bearbeiten</Text>
								</TouchableOpacity>
							</ScrollView>
						)}

						<View style={dynamicStyles.section}>
							<SectionHeader
								title="Neue Geschichte"
								showInfo={showStoryInfo}
								onToggleInfo={() => setShowStoryInfo(!showStoryInfo)}
								titleSize={sectionTitleSize}
								iconSize={infoIconSize}
							/>
							{showStoryInfo && (
								<Text style={[styles.sectionInfo, { fontSize: sectionInfoSize }]}>
									Schreibe eine neue Geschichte mit {character.name}. Die Geschichte wird
									automatisch gespeichert und erscheint auf der Startseite.
								</Text>
							)}
							<TextField
								placeholder="z.B. Heute erlebt mein Charakter ein spannendes Abenteuer im Zauberwald, wo magische Kreaturen wohnen..."
								value={storyText}
								onChangeText={setStoryText}
								placeholderTextColor="#666666"
								multiline
								numberOfLines={4}
								variant="large"
							/>
							<View style={styles.buttonContainer}>
								<Button
									title={isSubmitting ? 'Wird gespeichert...' : 'Geschichte erstellen'}
									onPress={handleCreateStory}
									style={styles.createButton}
									disabled={isSubmitting || !storyText.trim()}
									variant="primary"
									size="lg"
									iconName="chevron.right"
									iconSet="sf-symbols"
									iconPosition="right"
								/>
							</View>
						</View>
					</View>
				</View>
			</KeyboardAwareScrollView>

			<Modal
				visible={showSharingModal}
				transparent={true}
				animationType="slide"
				onRequestClose={() => setShowSharingModal(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={styles.modalContent}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>Charakter teilen</Text>
							<TouchableOpacity onPress={() => setShowSharingModal(false)}>
								<Ionicons name="close" size={24} color="#ffffff" />
							</TouchableOpacity>
						</View>

						<Text style={styles.modalDescription}>
							Wähle, wie du deinen Charakter teilen möchtest:
						</Text>

						<TouchableOpacity
							style={[
								styles.sharingOption,
								selectedSharingPreference === 'private' && styles.selectedOption,
							]}
							onPress={() => setSelectedSharingPreference('private')}
						>
							<Ionicons name="lock-closed" size={24} color="#999999" />
							<View style={styles.optionTextContainer}>
								<Text style={styles.optionTitle}>Privat</Text>
								<Text style={styles.optionDescription}>Nur für dich sichtbar</Text>
							</View>
							{selectedSharingPreference === 'private' && (
								<Ionicons name="checkmark-circle" size={24} color="#FFD700" />
							)}
						</TouchableOpacity>

						<TouchableOpacity
							style={[
								styles.sharingOption,
								selectedSharingPreference === 'link_only' && styles.selectedOption,
							]}
							onPress={() => setSelectedSharingPreference('link_only')}
						>
							<Ionicons name="link" size={24} color="#999999" />
							<View style={styles.optionTextContainer}>
								<Text style={styles.optionTitle}>Nur per Link</Text>
								<Text style={styles.optionDescription}>Teilbar über einen Share-Code</Text>
							</View>
							{selectedSharingPreference === 'link_only' && (
								<Ionicons name="checkmark-circle" size={24} color="#FFD700" />
							)}
						</TouchableOpacity>

						<TouchableOpacity
							style={[
								styles.sharingOption,
								selectedSharingPreference === 'public' && styles.selectedOption,
							]}
							onPress={() => setSelectedSharingPreference('public')}
						>
							<Ionicons name="eye" size={24} color="#999999" />
							<View style={styles.optionTextContainer}>
								<Text style={styles.optionTitle}>Öffentlich</Text>
								<Text style={styles.optionDescription}>In der Entdecken-Sektion sichtbar</Text>
							</View>
							{selectedSharingPreference === 'public' && (
								<Ionicons name="checkmark-circle" size={24} color="#FFD700" />
							)}
						</TouchableOpacity>

						<View style={styles.modalButtons}>
							<Button
								title="Abbrechen"
								onPress={() => setShowSharingModal(false)}
								variant="secondary"
								size="md"
								style={styles.modalButton}
								color="#333333"
								textStyle={{ color: '#ffffff' }}
							/>
							<Button
								title={
									character?.is_published && selectedSharingPreference === 'private'
										? 'Zurückziehen'
										: 'Veröffentlichen'
								}
								onPress={
									selectedSharingPreference === 'private'
										? handleUnpublishCharacter
										: handlePublishCharacter
								}
								variant="primary"
								size="md"
								style={styles.modalButton}
							/>
						</View>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#181818',
		height: SCREEN_HEIGHT,
	},
	centeredWrapper: {
		width: '100%',
		maxWidth: 1200,
		alignSelf: 'center',
	},
	container: {
		maxWidth: 600,
		alignSelf: 'center',
		width: '100%',
		flex: 1,
		justifyContent: 'center',
	},
	editNameContainer: {
		width: '100%',
		marginBottom: 16,
	},
	nameInput: {
		fontSize: 24,
		fontWeight: 'bold',
		textAlign: 'center',
	},
	editButtonsRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		marginBottom: 16,
	},
	cancelButton: {
		flex: 1,
		marginRight: 8,
		borderRadius: 12,
	},
	confirmButton: {
		flex: 1,
		marginLeft: 8,
		borderRadius: 12,
	},
	archiveButton: {
		borderRadius: 12,
	},

	skeletonImage: {
		marginBottom: 16,
	},
	skeletonText: {
		height: 20,
		width: '80%',
		borderRadius: 4,
		marginBottom: 12,
	},
	contentContainer: {
		flexGrow: 1,
		paddingTop: 20,
		paddingBottom: 20,
		width: '100%',
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
	},
	characterHeader: {
		alignItems: 'center',
		width: '100%',
		marginTop: 80,
		marginBottom: 24,
		display: 'flex',
		flexDirection: 'column',
	},
	characterImage: {
		borderRadius: 120,
		backgroundColor: '#333333',
		marginBottom: 16,
	},
	blurHashPlaceholder: {
		position: 'absolute',
		zIndex: 1,
	},
	hiddenImage: {
		opacity: 0,
	},
	characterName: {
		fontSize: 32,
		fontWeight: 'bold',
		color: '#ffffff',
		textAlign: 'center',
		fontFamily: 'Grandstander_700Bold',
	},
	infoButton: {
		padding: 8,
	},
	section: {
		width: '100%',
		marginTop: 16,
		marginBottom: 24,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		borderRadius: 16,
		padding: 24,
	},
	sectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	titleContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		flex: 1,
	},
	sectionTitle: {
		fontSize: 24,
		fontWeight: '600',
		color: '#ffffff',
	},
	sectionInfo: {
		color: '#999999',
		fontSize: 18,
		marginBottom: 16,
		lineHeight: 26,
	},
	description: {
		fontSize: 16,
		color: '#999999',
		marginBottom: 16,
		lineHeight: 22,
	},
	buttonContainer: {
		width: '100%',
		marginTop: 0,
		paddingTop: 0,
	},
	createButton: {
		borderRadius: 12,
		width: '100%',
	},
	sharingStatusContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 12,
		gap: 12,
	},
	sharingBadge: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(255, 215, 0, 0.1)',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		gap: 6,
	},
	sharingBadgeText: {
		color: '#FFD700',
		fontSize: 14,
		fontWeight: '600',
	},
	actionButtonsScroller: {
		marginTop: 16,
		marginBottom: 16,
		width: '100%',
	},
	actionButtonsContainer: {
		paddingHorizontal: 16,
		alignItems: 'center',
	},
	shareButtonWrapper: {
		marginRight: 12,
	},
	actionButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(255, 255, 255, 0.05)',
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.1)',
		gap: 8,
		minWidth: 140,
	},
	actionButtonText: {
		color: '#ffffff',
		fontSize: 16,
		fontWeight: '600',
	},
	shareCodeContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		gap: 6,
	},
	shareCodeText: {
		color: '#999999',
		fontSize: 14,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.8)',
		justifyContent: 'flex-end',
	},
	modalContent: {
		backgroundColor: '#2C2C2C',
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		padding: 24,
		paddingBottom: 40,
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
	},
	modalTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		color: '#ffffff',
	},
	modalDescription: {
		fontSize: 16,
		color: '#999999',
		marginBottom: 24,
	},
	sharingOption: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(255, 255, 255, 0.05)',
		padding: 16,
		borderRadius: 12,
		marginBottom: 12,
	},
	selectedOption: {
		backgroundColor: 'rgba(255, 215, 0, 0.1)',
		borderWidth: 1,
		borderColor: 'rgba(255, 215, 0, 0.3)',
	},
	optionTextContainer: {
		flex: 1,
		marginLeft: 16,
	},
	optionTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#ffffff',
		marginBottom: 4,
	},
	optionDescription: {
		fontSize: 14,
		color: '#999999',
	},
	modalButtons: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 24,
		gap: 12,
	},
	modalButton: {
		flex: 1,
		borderRadius: 12,
	},
});
