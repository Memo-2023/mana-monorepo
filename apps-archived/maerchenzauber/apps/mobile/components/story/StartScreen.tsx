import React, { useEffect, useRef, useState } from 'react';
import {
	View,
	StyleSheet,
	Image as RNImage,
	Animated,
	TextInput,
	ScrollView,
	useWindowDimensions,
} from 'react-native';
import Text from '../atoms/Text';
import Button from '../atoms/Button';

interface StartScreenProps {
	title: string;
	characterName?: string;
	isEditMode?: boolean;
	onTitleChange?: (newTitle: string) => void;
	onCancelEdit?: () => void;
	onSaveEdit?: () => void;
}

export default function StartScreen({
	title,
	characterName,
	isEditMode = false,
	onTitleChange,
	onCancelEdit,
	onSaveEdit,
}: StartScreenProps) {
	const [localTitle, setLocalTitle] = useState(title);
	const { width: windowWidth } = useWindowDimensions();
	const isTablet = windowWidth >= 768;

	// Responsive font sizes
	const titleFontSize = isTablet ? 42 : 32;
	const titleLineHeight = isTablet ? 56 : 42;
	const subtitleFontSize = isTablet ? 18 : 16;

	// Update local title when prop changes
	useEffect(() => {
		setLocalTitle(title);
	}, [title]);
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const slideAnim = useRef(new Animated.Value(20)).current;
	const backgroundFadeAnim = useRef(new Animated.Value(0)).current;
	const hintFadeAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		// Start background fade-in immediately
		Animated.timing(backgroundFadeAnim, {
			toValue: 1,
			duration: 600,
			useNativeDriver: true,
		}).start();

		// Start title fade-in animation after a short delay
		setTimeout(() => {
			Animated.parallel([
				Animated.timing(fadeAnim, {
					toValue: 1,
					duration: 800,
					useNativeDriver: true,
				}),
				Animated.timing(slideAnim, {
					toValue: 0,
					duration: 800,
					useNativeDriver: true,
				}),
			]).start();
		}, 200);

		// Start hint fade-in animation later and slower
		setTimeout(() => {
			Animated.timing(hintFadeAnim, {
				toValue: 1,
				duration: 1200,
				useNativeDriver: true,
			}).start();
		}, 1000);
	}, []);

	const handleTitleChange = (newTitle: string) => {
		setLocalTitle(newTitle);
		onTitleChange?.(newTitle);
	};

	return (
		<View style={styles.container}>
			{/* Background Pattern */}
			<Animated.View style={[styles.backgroundDecoration, { opacity: backgroundFadeAnim }]}>
				<RNImage
					source={require('../../assets/images/backgroundpattern-01.png')}
					style={styles.backgroundImage}
					resizeMode="cover"
				/>
			</Animated.View>

			{/* Content */}
			<View style={[styles.content, { paddingHorizontal: isTablet ? 40 : 24 }]}>
				{!isEditMode && (
					<>
						<Animated.View
							style={[
								styles.titleContainer,
								{ maxWidth: isTablet ? '75%' : '90%' },
								{
									opacity: fadeAnim,
									transform: [{ translateY: slideAnim }],
								},
							]}
						>
							<Text
								variant="header"
								color="#FFFFFF"
								style={[
									styles.title,
									{
										fontSize: titleFontSize,
										lineHeight: titleLineHeight,
										minHeight: titleLineHeight,
									},
								]}
							>
								{localTitle}
							</Text>

							<View style={styles.subtitleContainer}>
								{characterName && (
									<Text
										variant="subheader"
										color="#FFFFFF"
										style={[styles.subtitle, { fontSize: subtitleFontSize }]}
									>
										Eine Geschichte mit {characterName}
									</Text>
								)}
							</View>
						</Animated.View>

						<Animated.View style={[styles.hintContainer, { opacity: hintFadeAnim }]}>
							<Text variant="caption" color="rgba(255, 255, 255, 0.7)" style={styles.hint}>
								Wische um zu beginnen →
							</Text>
						</Animated.View>
					</>
				)}
			</View>

			{/* Edit Mode Overlay - TextInput over the title */}
			{isEditMode && (
				<View style={styles.editOverlay} pointerEvents="auto">
					<View style={styles.editOverlayContent} pointerEvents="auto">
						<ScrollView
							style={styles.editOverlayScroll}
							contentContainerStyle={styles.editOverlayScrollContent}
							showsVerticalScrollIndicator={true}
							persistentScrollbar={true}
							indicatorStyle="white"
							bounces={false}
							keyboardShouldPersistTaps="handled"
						>
							<TextInput
								value={localTitle}
								onChangeText={handleTitleChange}
								multiline
								style={styles.editOverlayInput}
								placeholderTextColor="#AAAAAA"
								placeholder="Titel bearbeiten..."
								autoCorrect={true}
								spellCheck={true}
								autoFocus={true}
								textAlign="center"
							/>
						</ScrollView>

						{/* Action Buttons */}
						<View style={styles.editOverlayButtons}>
							<Button
								title="Abbrechen"
								onPress={onCancelEdit}
								variant="tonal"
								size="md"
								color="#666666"
								style={styles.editButton}
							/>
							<Button
								title="Speichern"
								onPress={onSaveEdit}
								variant="primary"
								size="md"
								color="#4CAF50"
								iconName="checkmark"
								iconSet="sf-symbols"
								iconPosition="left"
								style={styles.editButton}
							/>
						</View>
					</View>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		width: '100%',
		height: '100%',
		position: 'relative',
		backgroundColor: '#121212',
	},
	backgroundDecoration: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		width: '100%',
		height: '100%',
		overflow: 'hidden',
	},
	backgroundImage: {
		width: '100%',
		height: '100%',
		opacity: 0.02,
	},
	content: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		width: '100%',
		zIndex: 1,
	},
	titleContainer: {
		width: '100%',
		alignItems: 'center',
	},
	title: {
		fontWeight: 'bold',
		textAlign: 'center',
		letterSpacing: 1,
		marginBottom: 16,
		textShadowColor: 'rgba(0, 0, 0, 0.3)',
		textShadowOffset: { width: 0, height: 2 },
		textShadowRadius: 4,
		fontFamily: 'Grandstander_700Bold',
		paddingHorizontal: 0,
	},
	subtitleContainer: {
		width: '100%',
		alignItems: 'center',
		minHeight: 64,
		justifyContent: 'flex-start',
	},
	subtitle: {
		textAlign: 'center',
		opacity: 0.9,
		fontWeight: '500',
		lineHeight: 24,
	},
	hintContainer: {
		position: 'absolute',
		bottom: 60,
		minHeight: 20,
	},
	hint: {
		fontSize: 16,
		textAlign: 'center',
		fontStyle: 'italic',
	},
	// Edit Mode Overlay Styles
	editOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 24,
		zIndex: 999,
		backgroundColor: 'rgba(0, 0, 0, 0.7)',
		elevation: 999, // Android
	},
	editOverlayContent: {
		backgroundColor: 'rgba(0, 0, 0, 0.95)',
		borderRadius: 16,
		overflow: 'hidden',
		borderWidth: 2,
		borderColor: 'rgba(76, 175, 80, 0.5)',
		flexDirection: 'column',
		width: '100%',
		maxWidth: 500,
		minHeight: 300,
		maxHeight: '70%',
		zIndex: 1000,
		elevation: 1000, // Android
	},
	editOverlayScroll: {
		flex: 1,
		width: '100%',
	},
	editOverlayScrollContent: {
		padding: 24,
		paddingBottom: 16,
		flexGrow: 1,
	},
	editOverlayInput: {
		color: '#FFFFFF',
		fontSize: 28,
		lineHeight: 40,
		textAlign: 'center',
		minHeight: 200,
		fontWeight: 'bold',
		fontFamily: 'Grandstander_700Bold',
		textAlignVertical: 'top',
	},
	editOverlayButtons: {
		flexDirection: 'row',
		gap: 12,
		padding: 12,
		paddingTop: 8,
		borderTopWidth: 1,
		borderTopColor: 'rgba(255, 255, 255, 0.1)',
	},
	editButton: {
		flex: 1,
	},
});
