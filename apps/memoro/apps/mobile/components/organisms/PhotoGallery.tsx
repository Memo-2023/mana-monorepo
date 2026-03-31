import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
	View,
	ScrollView,
	Image,
	TouchableOpacity,
	StyleSheet,
	Modal,
	Alert,
	SafeAreaView,
	Dimensions,
	Platform,
	Animated as RNAnimated,
} from 'react-native';
import * as Haptics from 'expo-haptics';

// Import zoom toolkit for native platforms
let Gallery: any = null;
let ResumableZoom: any = null;
let GestureHandlerRootView: any = null;

if (Platform.OS !== 'web') {
	try {
		const zoomToolkit = require('react-native-zoom-toolkit');
		Gallery = zoomToolkit.Gallery;
		ResumableZoom = zoomToolkit.ResumableZoom;

		// Import GestureHandlerRootView
		const gestureHandler = require('react-native-gesture-handler');
		GestureHandlerRootView = gestureHandler.GestureHandlerRootView;
	} catch (error) {
		console.warn('react-native-zoom-toolkit not available:', error);
	}
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
import { useTheme } from '~/features/theme/ThemeProvider';
import { MemoPhoto } from '~/features/storage/storage.types';
import Text from '~/components/atoms/Text';
import Icon from '~/components/atoms/Icon';
import { useTranslation } from 'react-i18next';

interface PhotoGalleryProps {
	memoId: string;
	photos: MemoPhoto[];
	onPhotosChange?: (photos: MemoPhoto[]) => void;
	onPhotoDelete?: (photoPath: string) => void;
	onAddPhotoPress?: () => void;
	editable?: boolean;
	showAddButton?: boolean;
	loading?: boolean;
}

interface PhotoViewerModalProps {
	visible: boolean;
	photos: MemoPhoto[];
	initialIndex: number;
	onClose: () => void;
	onDelete?: (photoPath: string) => void;
	editable?: boolean;
}

function PhotoViewerModal({
	visible,
	photos,
	initialIndex,
	onClose,
	onDelete,
	editable,
}: PhotoViewerModalProps) {
	const { isDark } = useTheme();
	const { t } = useTranslation();
	const [currentIndex, setCurrentIndex] = useState(initialIndex);
	const [showMenuElements, setShowMenuElements] = useState(true);
	const [autoHideEnabled, setAutoHideEnabled] = useState(true);
	const fadeAnim = useRef(new RNAnimated.Value(1)).current;
	const hideMenuTimer = useRef<NodeJS.Timeout | null>(null);

	// Reset current index when initialIndex changes
	useEffect(() => {
		setCurrentIndex(initialIndex);
	}, [initialIndex]);

	// Auto-hide menu elements after 3 seconds
	useEffect(() => {
		if (visible && autoHideEnabled) {
			setShowMenuElements(true);

			// Clear any existing timer
			if (hideMenuTimer.current) {
				clearTimeout(hideMenuTimer.current);
			}

			// Set new timer
			hideMenuTimer.current = setTimeout(() => {
				setShowMenuElements(false);
			}, 3000);

			return () => {
				if (hideMenuTimer.current) {
					clearTimeout(hideMenuTimer.current);
				}
			};
		}
	}, [visible, autoHideEnabled]);

	const toggleMenuElements = useCallback(() => {
		const newShowState = !showMenuElements;
		setShowMenuElements(newShowState);
		setAutoHideEnabled(false); // Disable auto-hide after manual toggle

		// Clear any existing timer
		if (hideMenuTimer.current) {
			clearTimeout(hideMenuTimer.current);
		}

		RNAnimated.timing(fadeAnim, {
			toValue: newShowState ? 1 : 0,
			duration: 300,
			useNativeDriver: true,
		}).start();
	}, [showMenuElements, fadeAnim]);

	// Animate menu elements visibility
	useEffect(() => {
		RNAnimated.timing(fadeAnim, {
			toValue: showMenuElements ? 1 : 0,
			duration: 300,
			useNativeDriver: true,
		}).start();
	}, [showMenuElements, fadeAnim]);

	const currentPhoto = photos[currentIndex] || null;

	const handleDelete = () => {
		if (!currentPhoto || !onDelete) return;

		Alert.alert(
			t('memo.delete_photo_title', 'Foto löschen'),
			t('memo.delete_photo_message', 'Möchten Sie dieses Foto wirklich löschen?'),
			[
				{
					text: t('common.cancel', 'Abbrechen'),
					style: 'cancel',
				},
				{
					text: t('common.delete', 'Löschen'),
					style: 'destructive',
					onPress: () => {
						onDelete(currentPhoto.path);
						if (photos.length <= 1) {
							onClose();
						} else if (currentIndex >= photos.length - 1) {
							setCurrentIndex(Math.max(0, currentIndex - 1));
						}
					},
				},
			]
		);
	};

	if (!currentPhoto || photos.length === 0) return null;

	// Use Gallery component for native platforms
	if (Platform.OS !== 'web' && Gallery && ResumableZoom) {
		// Debug logging
		console.log('Gallery photos:', photos);
		console.log('Gallery initialIndex:', initialIndex);
		console.log('Current photo:', currentPhoto);

		return (
			<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
				<GestureHandlerRootView style={{ flex: 1 }}>
					<View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.95)' }]}>
						<SafeAreaView style={styles.modalSafeArea}>
							{/* Header */}
							<RNAnimated.View
								style={[
									styles.modalHeader,
									{
										opacity: fadeAnim,
										transform: [
											{
												translateY: fadeAnim.interpolate({
													inputRange: [0, 1],
													outputRange: [-60, 0],
												}),
											},
										],
									},
								]}
								pointerEvents={showMenuElements ? 'auto' : 'none'}
							>
								<Text style={[styles.modalTitle, { color: '#FFFFFF' }]}>
									{currentPhoto.filename} ({currentIndex + 1}/{photos.length})
								</Text>
								<View style={styles.modalHeaderActions}>
									{editable && onDelete && (
										<TouchableOpacity style={styles.modalHeaderButton} onPress={handleDelete}>
											<Icon name="trash-outline" size={24} color="#FFFFFF" />
										</TouchableOpacity>
									)}
									<TouchableOpacity style={styles.modalHeaderButton} onPress={onClose}>
										<Icon name="close" size={24} color="#FFFFFF" />
									</TouchableOpacity>
								</View>
							</RNAnimated.View>

							{/* Gallery Component */}
							<View style={styles.galleryContainer}>
								<Gallery
									data={photos}
									keyExtractor={(item, index) => item?.path || index.toString()}
									initialIndex={initialIndex}
									onIndexChange={(index) => {
										console.log('Gallery index changed to:', index);
										setCurrentIndex(index);
									}}
									renderItem={(photo) => {
										console.log('Gallery renderItem called with photo:', photo);

										// Safety check for photo
										if (!photo || !photo.signedUrl) {
											console.log('No photo or signedUrl, showing placeholder');
											return (
												<View
													style={[
														styles.placeholderContainer,
														{
															backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
															width: screenWidth,
															height: screenHeight - 160,
															justifyContent: 'center',
															alignItems: 'center',
														},
													]}
												>
													<Icon
														name="image-outline"
														size={48}
														color={isDark ? '#666666' : '#CCCCCC'}
													/>
													<Text style={{ color: isDark ? '#666666' : '#CCCCCC', marginTop: 8 }}>
														{t('memo.image_not_available', 'Bild nicht verfügbar')}
													</Text>
												</View>
											);
										}

										console.log('Rendering image with URL:', photo.signedUrl);
										return (
											<ResumableZoom maxScale={5} minScale={1}>
												<Image
													source={{ uri: photo.signedUrl }}
													style={{
														width: screenWidth,
														height: screenHeight - 160, // Account for header and footer
													}}
													resizeMode="contain"
													onLoadStart={() => console.log('Loading image:', photo.path)}
													onLoad={() => console.log('Image loaded:', photo.path)}
													onError={(e) => console.error('Image error:', photo.path, e)}
												/>
											</ResumableZoom>
										);
									}}
									onTap={toggleMenuElements}
									onDoubleTap={() => {}} // Handled by ResumableZoom
									pinchCenteringMode="sync"
									style={{ flex: 1 }}
								/>
							</View>

							{/* Footer */}
							<RNAnimated.View
								style={[
									styles.modalFooter,
									{
										opacity: fadeAnim,
										transform: [
											{
												translateY: fadeAnim.interpolate({
													inputRange: [0, 1],
													outputRange: [60, 0],
												}),
											},
										],
									},
								]}
								pointerEvents={showMenuElements ? 'auto' : 'none'}
							>
								<Text style={[styles.imageInfo, { color: '#FFFFFF' }]}>
									{t('memo.uploaded_at', 'Hochgeladen am: {{date}}', {
										date: new Date(currentPhoto.uploadedAt).toLocaleDateString(),
									})}
								</Text>
								{currentPhoto.fileSize && (
									<Text style={[styles.imageInfo, { color: '#FFFFFF' }]}>
										{t('memo.file_size', 'Größe: {{size}}', {
											size: (currentPhoto.fileSize / 1024 / 1024).toFixed(2) + ' MB',
										})}
									</Text>
								)}
							</RNAnimated.View>
						</SafeAreaView>
					</View>
				</GestureHandlerRootView>
			</Modal>
		);
	}

	// Fallback for web - simple image viewer
	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.9)' }]}>
				<SafeAreaView style={styles.modalSafeArea}>
					{/* Header */}
					<View style={styles.modalHeader}>
						<Text style={[styles.modalTitle, { color: '#FFFFFF' }]}>
							{currentPhoto.filename} ({currentIndex + 1}/{photos.length})
						</Text>
						<View style={styles.modalHeaderActions}>
							{editable && onDelete && (
								<TouchableOpacity style={styles.modalHeaderButton} onPress={handleDelete}>
									<Icon name="trash-outline" size={24} color="#FFFFFF" />
								</TouchableOpacity>
							)}
							<TouchableOpacity style={styles.modalHeaderButton} onPress={onClose}>
								<Icon name="close" size={24} color="#FFFFFF" />
							</TouchableOpacity>
						</View>
					</View>

					{/* Simple Image Display for Web */}
					<View style={styles.modalImageContainer}>
						<ScrollView
							horizontal
							pagingEnabled
							showsHorizontalScrollIndicator={false}
							onMomentumScrollEnd={(event) => {
								const newIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
								setCurrentIndex(newIndex);
							}}
							contentOffset={{ x: initialIndex * screenWidth, y: 0 }}
						>
							{photos.map((photo, index) => (
								<View key={photo.path} style={{ width: screenWidth, height: screenHeight - 200 }}>
									{photo.signedUrl ? (
										<Image
											source={{ uri: photo.signedUrl }}
											style={styles.webImage}
											resizeMode="contain"
										/>
									) : (
										<View
											style={[
												styles.placeholderContainer,
												{ backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5' },
											]}
										>
											<Icon name="image-outline" size={48} color={isDark ? '#666666' : '#CCCCCC'} />
											<Text style={{ color: isDark ? '#666666' : '#CCCCCC', marginTop: 8 }}>
												{t('memo.image_not_available', 'Bild nicht verfügbar')}
											</Text>
										</View>
									)}
								</View>
							))}
						</ScrollView>
					</View>

					{/* Footer */}
					<View style={styles.modalFooter}>
						<Text style={[styles.imageInfo, { color: '#FFFFFF' }]}>
							{t('memo.uploaded_at', 'Hochgeladen am: {{date}}', {
								date: new Date(currentPhoto.uploadedAt).toLocaleDateString(),
							})}
						</Text>
						{currentPhoto.fileSize && (
							<Text style={[styles.imageInfo, { color: '#FFFFFF' }]}>
								{t('memo.file_size', 'Größe: {{size}}', {
									size: (currentPhoto.fileSize / 1024 / 1024).toFixed(2) + ' MB',
								})}
							</Text>
						)}
					</View>
				</SafeAreaView>
			</View>
		</Modal>
	);
}

export default function PhotoGallery({
	memoId,
	photos,
	onPhotosChange,
	onPhotoDelete,
	onAddPhotoPress,
	editable = true,
	showAddButton = false,
	loading = false,
}: PhotoGalleryProps) {
	const { isDark, themeVariant } = useTheme();
	const { t } = useTranslation();
	const [viewerVisible, setViewerVisible] = useState(false);
	const [initialPhotoIndex, setInitialPhotoIndex] = useState(0);

	const handlePhotoPress = (photo: MemoPhoto) => {
		const photoIndex = photos.findIndex((p) => p.path === photo.path);
		setInitialPhotoIndex(photoIndex >= 0 ? photoIndex : 0);
		setViewerVisible(true);
	};

	const handleCloseViewer = () => {
		setViewerVisible(false);
	};

	const handleDeletePhoto = (photoPath: string) => {
		if (onPhotoDelete) {
			onPhotoDelete(photoPath);
		}

		// Update local state if onPhotosChange is provided
		if (onPhotosChange) {
			const updatedPhotos = photos.filter((photo) => photo.path !== photoPath);
			onPhotosChange(updatedPhotos);
		}
	};

	const handleDeletePhotoWithConfirmation = (photoPath: string) => {
		Alert.alert(
			t('memo.delete_photo_title', 'Foto löschen'),
			t('memo.delete_photo_message', 'Möchten Sie dieses Foto wirklich löschen?'),
			[
				{
					text: t('common.cancel', 'Abbrechen'),
					style: 'cancel',
				},
				{
					text: t('common.delete', 'Löschen'),
					style: 'destructive',
					onPress: () => handleDeletePhoto(photoPath),
				},
			]
		);
	};

	// Haptic feedback for long press
	const triggerLongPressHaptic = async () => {
		try {
			await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		} catch (error) {
			console.debug('Haptic feedback error:', error);
		}
	};

	// Get photo menu items for Zeego DropdownMenu
	const getPhotoMenuItems = (photo: MemoPhoto) => {
		const menuItems = [
			{
				key: 'preview',
				title: t('memo.preview_photo', 'Vorschau anzeigen'),
				systemIcon: 'eye',
				onSelect: () => handlePhotoPress(photo),
			},
		];

		if (editable) {
			menuItems.push({
				key: 'delete',
				title: t('common.delete', 'Löschen'),
				systemIcon: 'trash',
				destructive: true,
				onSelect: () => handleDeletePhotoWithConfirmation(photo.path),
			});
		}

		return menuItems;
	};

	return (
		<View style={styles.fullWidthContainer}>
			<View style={styles.header}>
				<Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
					{photos.length}{' '}
					{photos.length === 1
						? t('memo.photo_singular', 'Photo')
						: t('memo.photos_section', 'Fotos')}
				</Text>
			</View>

			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.scrollContent}
				style={styles.scrollContainer}
			>
				{/* Existing Photos */}
				{photos.map((photo) => {
					const photoMenuItems = getPhotoMenuItems(photo);

					// Photo thumbnail content with long-press handler
					const handlePhotoLongPress = () => {
						triggerLongPressHaptic();

						// Show action sheet for native platforms
						if (Platform.OS !== 'web' && photoMenuItems.length > 0) {
							const buttons = photoMenuItems.map((item) => ({
								text: item.title,
								style: item.destructive ? ('destructive' as const) : ('default' as const),
								onPress: item.onSelect,
							}));
							buttons.push({ text: t('cancel'), style: 'cancel' });

							Alert.alert(t('photo_options', 'Photo Options'), undefined, buttons);
						}
					};

					const thumbnailContent = (
						<TouchableOpacity
							style={[styles.photoThumbnail, { borderColor: isDark ? '#333333' : '#E0E0E0' }]}
							onPress={() => handlePhotoPress(photo)}
							onLongPress={handlePhotoLongPress}
							activeOpacity={0.8}
						>
							{photo.signedUrl ? (
								<Image
									source={{ uri: photo.signedUrl }}
									style={styles.thumbnailImage}
									resizeMode="cover"
								/>
							) : (
								<View
									style={[
										styles.placeholderThumbnail,
										{ backgroundColor: isDark ? '#2A2A2A' : '#F0F0F0' },
									]}
								>
									<Icon name="image-outline" size={32} color={isDark ? '#666666' : '#CCCCCC'} />
								</View>
							)}
						</TouchableOpacity>
					);

					// Return the thumbnail directly (context menu functionality moved to long-press)
					return <View key={photo.path}>{thumbnailContent}</View>;
				})}

				{/* Add Photo Button at the end */}
				{editable && (
					<TouchableOpacity
						style={[
							styles.addPhotoThumbnail,
							{
								borderColor: isDark ? '#333333' : '#E0E0E0',
								backgroundColor: isDark ? 'rgba(60, 60, 60, 0.3)' : 'rgba(240, 240, 240, 0.3)',
							},
						]}
						onPress={
							onAddPhotoPress || (() => console.log('Add photo pressed but no handler provided'))
						}
						disabled={loading || !onAddPhotoPress}
						activeOpacity={0.8}
					>
						{loading ? (
							<>
								<Icon name="hourglass-outline" size={32} color={isDark ? '#666666' : '#CCCCCC'} />
								<Text
									style={[styles.addPhotoThumbnailText, { color: isDark ? '#CCCCCC' : '#666666' }]}
								>
									{t('memo.uploading', 'Wird hochgeladen...')}
								</Text>
							</>
						) : (
							<>
								<Icon name="add" size={32} color={isDark ? '#FFFFFF' : '#000000'} />
								<Text
									style={[styles.addPhotoThumbnailText, { color: isDark ? '#FFFFFF' : '#000000' }]}
								>
									{t('memo.add_photos', 'Fotos hinzufügen')}
								</Text>
							</>
						)}
					</TouchableOpacity>
				)}
			</ScrollView>

			<PhotoViewerModal
				visible={viewerVisible}
				photos={photos}
				initialIndex={initialPhotoIndex}
				onClose={handleCloseViewer}
				onDelete={handleDeletePhoto}
				editable={editable}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	fullWidthContainer: {
		marginHorizontal: -20, // Optimiertes negatives Margin für perfekte Ausrichtung
		marginTop: 16, // Erhöhter Abstand nach oben
	},
	header: {
		marginBottom: 12,
		paddingLeft: 16,
	},
	title: {
		fontSize: 16,
		fontWeight: '600',
	},
	scrollContainer: {
		// ScrollView nimmt volle Breite ein
	},
	scrollContent: {
		paddingLeft: 16,
		paddingRight: 16,
		gap: 16,
	},
	photoThumbnail: {
		width: 120,
		height: 120,
		borderRadius: 12,
		borderWidth: 1,
		overflow: 'hidden',
		position: 'relative',
	},
	addPhotoButton: {
		width: 120,
		height: 120,
		borderRadius: 12,
		borderWidth: 1,
		borderStyle: 'dashed',
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: 12,
	},
	addPhotoText: {
		fontSize: 12,
		textAlign: 'center',
		marginTop: 6,
		fontWeight: '500',
	},
	addPhotoThumbnail: {
		width: 120,
		height: 120,
		borderRadius: 12,
		borderWidth: 1,
		borderStyle: 'dashed',
		justifyContent: 'center',
		alignItems: 'center',
		overflow: 'hidden',
	},
	addPhotoThumbnailText: {
		fontSize: 11,
		textAlign: 'center',
		marginTop: 6,
		fontWeight: '500',
		lineHeight: 13,
	},
	thumbnailImage: {
		width: '100%',
		height: '100%',
	},
	placeholderThumbnail: {
		width: '100%',
		height: '100%',
		justifyContent: 'center',
		alignItems: 'center',
	},

	// Modal styles
	modalOverlay: {
		flex: 1,
	},
	modalSafeArea: {
		flex: 1,
	},
	modalHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 16,
		paddingVertical: 12,
		zIndex: 10,
	},
	modalTitle: {
		fontSize: 16,
		fontWeight: '600',
		flex: 1,
		marginRight: 16,
	},
	modalHeaderActions: {
		flexDirection: 'row',
		gap: 16,
	},
	modalHeaderButton: {
		padding: 8,
	},
	modalContent: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 16,
	},
	modalImageContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		position: 'relative',
	},
	photoCarousel: {
		flex: 1,
	},
	photoSlide: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		position: 'relative',
	},
	galleryContainer: {
		flex: 1,
		backgroundColor: 'transparent',
	},
	webImage: {
		width: '100%',
		height: '100%',
	},
	modalImage: {
		backgroundColor: 'transparent',
	},
	imageWrapper: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		width: '100%',
		height: '100%',
	},
	placeholderContainer: {
		width: 200,
		height: 200,
		borderRadius: 12,
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalFooter: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		paddingBottom: 20,
	},
	imageInfo: {
		fontSize: 14,
		textAlign: 'center',
		marginVertical: 2,
	},

	// Loading styles
	loadingContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 10,
	},
	loadingText: {
		color: '#FFFFFF',
		fontSize: 16,
		marginTop: 16,
		textAlign: 'center',
	},
});
