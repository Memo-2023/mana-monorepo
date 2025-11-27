import React, { useEffect, useRef, useState } from 'react';
import {
	View,
	StyleSheet,
	Animated,
	TouchableOpacity,
	Platform,
	Dimensions,
	Alert,
	ScrollView,
	useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStories } from '../../hooks/useStories';
import { useAuth } from '../../src/contexts/AuthContext';
import { usePostHog } from '../../src/hooks/usePostHog';
import { useStoryEngagement } from '../../hooks/useStoryEngagement';
import { analytics } from '../../src/services/analytics';
import { dataService } from '../../src/utils/dataService';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import StoryViewer from '../../components/story/StoryViewer';
import StoryLoadingSkeleton from '../../components/story/StoryLoadingSkeleton';
import Text from '../../components/atoms/Text';
import Button from '../../components/atoms/Button';
import Modal from '../../components/atoms/Modal';
import ShareButton from '../../components/molecules/ShareButton';
import VotingButton from '../../components/molecules/VotingButton';
import PublishStoryButton from '../../components/molecules/PublishStoryButton';
import TimeOfDayBackground from '../../components/atoms/TimeOfDayBackground';
import { getTimeOfDay } from '../../src/utils/timeOfDay';
import { getTimeOfDayTheme } from '../../src/constants/timeOfDayThemes';

export default function StoryPage() {
	const { id } = useLocalSearchParams();
	const router = useRouter();
	const { getStoryById, loading, refreshStories } = useStories();
	const { user } = useAuth();
	const posthog = usePostHog();
	const { width: windowWidth } = useWindowDimensions();
	const isTablet = windowWidth >= 768;

	// Responsive font sizes for page numbers
	const pageNumberFontSize = isTablet ? 22 : 14;

	// Responsive button size
	const buttonSize = isTablet ? 'md' : ('sm' as 'sm' | 'md');

	// Story data
	const [story, setStory] = useState<any>(null);

	// Story engagement tracking - always call the hook (React rules)
	// It will only start tracking once story data is loaded
	const engagementTracking = useStoryEngagement({
		storyId: id as string,
		title: story?.title || 'Untitled',
		pageCount: story?.pages?.length || 0,
		enabled: !!story && !!story.pages, // Only track when story is loaded
	});
	const [voteCount, setVoteCount] = useState(0);
	const [userVoted, setUserVoted] = useState(false);
	const [isFavorite, setIsFavorite] = useState(false);
	const [isOwnStory, setIsOwnStory] = useState(false);

	// UI state
	const [currentPage, setCurrentPage] = useState(0);
	const [isEndScreen, setIsEndScreen] = useState(false);
	const [showArchiveModal, setShowArchiveModal] = useState(false);
	const fadeAnim = useRef(new Animated.Value(0)).current;
	const backgroundFadeAnim = useRef(new Animated.Value(0)).current;
	const headerVisible = useRef(false);
	const fadeOutTimer = useRef<NodeJS.Timeout | null>(null);

	// Edit mode state
	const [isEditMode, setIsEditMode] = useState(false);
	const [editedPages, setEditedPages] = useState<Map<number, string>>(new Map());
	const [editedTitle, setEditedTitle] = useState<string | undefined>(undefined);
	const [isSaving, setIsSaving] = useState(false);
	const [showCancelModal, setShowCancelModal] = useState(false);

	// Load story data
	useEffect(() => {
		if (id && !loading) {
			const storyData = getStoryById(id as string);
			if (storyData) {
				// Only update story if it's a different story (id changed) or first load
				const isNewStory = !story || story.id !== storyData.id;

				setStory(storyData);

				// Check if this is the user's own story by comparing userId
				const isOwn = user && storyData.user_id === user.id;
				setIsOwnStory(isOwn);

				// Only initialize vote/favorite state on first load or story change
				if (isNewStory) {
					if (isOwn) {
						// For own stories, use is_favorite field
						setIsFavorite(storyData.is_favorite || false);
					} else {
						// For public stories, use vote_count and user_voted
						setVoteCount(storyData.vote_count || 0);
						setUserVoted(storyData.user_voted || false);
					}
				}
			}
		}
	}, [id, loading, getStoryById, user]);

	// Track story start
	useEffect(() => {
		if (story && !loading) {
			posthog?.capture('story_started', {
				story_id: id,
				story_title: story.title,
				character_name: story.characterName,
				total_slides: story.pages.length + 2,
			});
		}
	}, [story, loading]);

	// Header auto-fade logic
	const startFadeOutTimer = () => {
		if (fadeOutTimer.current) {
			clearTimeout(fadeOutTimer.current);
		}
		fadeOutTimer.current = setTimeout(() => {
			Animated.timing(fadeAnim, {
				toValue: 0,
				duration: 500,
				useNativeDriver: true,
			}).start();
			headerVisible.current = false;
		}, 2000);
	};

	const showHeader = () => {
		if (!headerVisible.current) {
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 200,
				useNativeDriver: true,
			}).start();
			headerVisible.current = true;
		}
		// Always restart the fade-out timer, even if header is already visible
		startFadeOutTimer();
	};

	useEffect(() => {
		// Initial fade-in of header
		setTimeout(() => {
			Animated.timing(fadeAnim, {
				toValue: 1,
				duration: 600,
				useNativeDriver: true,
			}).start(() => {
				headerVisible.current = true;
				startFadeOutTimer();
			});
		}, 300);

		return () => {
			if (fadeOutTimer.current) {
				clearTimeout(fadeOutTimer.current);
			}
		};
	}, []);

	// Page change handler
	const handlePageChange = (pageIndex: number) => {
		const totalPages = story ? story.pages.length + 2 : 2;
		const isEnd = pageIndex >= totalPages - 1;

		setCurrentPage(pageIndex);
		setIsEndScreen(isEnd);

		// Animate background fade in/out
		if (isEnd) {
			Animated.timing(backgroundFadeAnim, {
				toValue: 1,
				duration: 1200,
				useNativeDriver: true,
			}).start();
		} else {
			Animated.timing(backgroundFadeAnim, {
				toValue: 0,
				duration: 400,
				useNativeDriver: true,
			}).start();
		}

		// Track page view for engagement metrics
		engagementTracking?.trackPageView(pageIndex);

		// Analytics tracking (legacy)
		if (story) {
			let slideType = 'story';
			if (pageIndex === 0) slideType = 'start';
			else if (isEnd) slideType = 'end';

			posthog?.capture('story_slide_viewed', {
				story_id: id,
				story_title: story.title,
				character_name: story.characterName,
				slide_number: pageIndex,
				slide_type: slideType,
				total_slides: totalPages,
			});
		}
	};

	// Action handlers
	const handleEndPress = () => {
		// Track end button click
		analytics.track('story_end_button_clicked', {
			storyId: id as string,
			title: story?.title || 'Unknown',
		});

		posthog?.capture('story_ended', {
			story_id: id,
			story_title: story?.title,
			character_name: story?.characterName,
		});
		router.push('/');
	};

	const handleRestartPress = () => {
		// Track restart button click
		analytics.track('story_restart_button_clicked', {
			storyId: id as string,
			fromPage: currentPage,
		});

		// Track restart with engagement tracking
		engagementTracking?.trackRestart(currentPage);

		posthog?.capture('story_restarted', {
			story_id: id,
			story_title: story?.title,
			character_name: story?.characterName,
		});
	};

	const handleArchivePress = () => {
		// Track archive button click (opening modal)
		analytics.track('story_archive_button_clicked', {
			storyId: id as string,
			title: story?.title || 'Unknown',
		});

		setShowArchiveModal(true);
	};

	const confirmArchive = async () => {
		try {
			await dataService.updateStory(id as string, { archived: true });

			// Track successful archive
			analytics.track('story_archived', {
				storyId: id as string,
				title: story?.title || 'Unknown',
			});

			posthog?.capture('story_archived', {
				story_id: id,
				story_title: story?.title,
				character_name: story?.characterName,
			});

			setShowArchiveModal(false);
			Toast.show({
				type: 'success',
				text1: '📦 Geschichte archiviert!',
				position: 'top',
				topOffset: 60,
				visibilityTime: 2000,
			});

			// Navigate back after short delay
			setTimeout(() => {
				router.push('/');
			}, 500);
		} catch (error) {
			console.error('Error archiving story:', error);
			Alert.alert(
				'Fehler',
				'Die Geschichte konnte nicht archiviert werden.\n\nBei anhaltenden Problemen helfen wir gerne unter support@manacore.ai weiter.'
			);
		}
	};

	// Favorite/Voting handlers
	const handleVote = async (storyId: string) => {
		try {
			if (isOwnStory) {
				// For own stories, toggle favorite
				const newFavoriteState = !isFavorite;
				// Update state immediately (optimistic update)
				setIsFavorite(newFavoriteState);

				try {
					await dataService.toggleFavorite(storyId, newFavoriteState);
					Toast.show({
						type: 'success',
						text1: newFavoriteState ? '⭐ Zu Favoriten hinzugefügt!' : '⭐ Aus Favoriten entfernt',
						position: 'top',
						topOffset: 60,
						visibilityTime: 2000,
					});
				} catch (error) {
					// Revert on error
					setIsFavorite(!newFavoriteState);
					throw error;
				}
			} else {
				// For public stories, vote
				const previousVoted = userVoted;
				const previousCount = voteCount;

				// Update state immediately (optimistic update)
				setUserVoted(true);
				setVoteCount((prev) => prev + 1);

				try {
					await dataService.voteForStory(storyId);
					Toast.show({
						type: 'success',
						text1: '❤️ Geschichte geliked!',
						position: 'top',
						topOffset: 60,
						visibilityTime: 2000,
					});
				} catch (error) {
					// Revert on error
					setUserVoted(previousVoted);
					setVoteCount(previousCount);
					throw error;
				}
			}
		} catch (error) {
			console.error('Error voting/favoriting:', error);
		}
	};

	const handleUnvote = async (storyId: string) => {
		try {
			if (isOwnStory) {
				// For own stories, toggle favorite
				const previousFavorite = isFavorite;

				// Update state immediately (optimistic update)
				setIsFavorite(false);

				try {
					await dataService.toggleFavorite(storyId, false);
				} catch (error) {
					// Revert on error
					setIsFavorite(previousFavorite);
					throw error;
				}
			} else {
				// For public stories, unvote
				const previousVoted = userVoted;
				const previousCount = voteCount;

				// Update state immediately (optimistic update)
				setUserVoted(false);
				setVoteCount((prev) => Math.max(0, prev - 1));

				try {
					await dataService.unvoteStory(storyId);
				} catch (error) {
					// Revert on error
					setUserVoted(previousVoted);
					setVoteCount(previousCount);
					throw error;
				}
			}
		} catch (error) {
			console.error('Error unvoting/unfavoriting:', error);
		}
	};

	// Edit mode handlers
	const handleEditPress = () => {
		if (isEditMode) {
			// Check if there are unsaved changes
			if (editedPages.size > 0 || editedTitle) {
				setShowCancelModal(true);
			} else {
				setIsEditMode(false);
			}
		} else {
			setIsEditMode(true);
			posthog?.capture('story_edit_started', {
				story_id: id,
				story_title: story?.title,
			});
		}
	};

	const handlePageTextChange = (pageIndex: number, newText: string) => {
		setEditedPages((prev) => {
			const updated = new Map(prev);
			updated.set(pageIndex, newText);
			return updated;
		});
	};

	const handleTitleChange = (newTitle: string) => {
		setEditedTitle(newTitle);
	};

	const handleCancelPageEdit = () => {
		// Don't save changes, just exit edit mode
		setIsEditMode(false);
		posthog?.capture('story_page_edit_cancelled', {
			story_id: id,
			story_title: story?.title,
		});
	};

	const handleSavePageEdit = () => {
		// Changes are already in editedPages Map
		// Just exit edit mode - user still needs to click main "Speichern" button
		setIsEditMode(false);
		posthog?.capture('story_page_edit_saved', {
			story_id: id,
			story_title: story?.title,
		});
	};

	const handleSaveChanges = async () => {
		if (!story || (editedPages.size === 0 && !editedTitle)) return;

		try {
			setIsSaving(true);

			// Build update payload
			const updatePayload: any = {};

			// Add title if changed
			if (editedTitle !== undefined) {
				updatePayload.title = editedTitle;
			}

			// Add pages_data if any page was edited
			if (editedPages.size > 0) {
				const updatedPagesData = story.pages.map((page: any, index: number) => {
					const editedText = editedPages.get(index);
					return {
						page_number: page.pageNumber || index + 1,
						story_text: editedText !== undefined ? editedText : page.story,
						image_url: page.image,
						blur_hash: page.blur_hash,
					};
				});
				updatePayload.pages_data = updatedPagesData;
			}

			// Update story via API
			await dataService.updateStory(id as string, updatePayload);

			// Refresh the stories cache to get updated data
			await refreshStories();

			// Get the updated story from the refreshed cache
			const updatedStory = getStoryById(id as string);
			if (updatedStory) {
				setStory(updatedStory);
			}

			// Clear edited pages, title and exit edit mode
			setEditedPages(new Map());
			setEditedTitle(undefined);
			setIsEditMode(false);

			posthog?.capture('story_edit_saved', {
				story_id: id,
				story_title: story?.title,
				pages_edited: editedPages.size,
				title_changed: !!editedTitle,
			});

			Toast.show({
				type: 'success',
				text1: '✅ Änderungen gespeichert!',
				position: 'top',
				topOffset: 60,
				visibilityTime: 2000,
			});
		} catch (error) {
			console.error('Error saving story changes:', error);
			Toast.show({
				type: 'error',
				text1: 'Fehler beim Speichern',
				text2:
					'Die Änderungen konnten nicht gespeichert werden. Bei anhaltenden Problemen helfen wir gerne unter support@manacore.ai weiter.',
				position: 'top',
				topOffset: 60,
				visibilityTime: 3000,
			});
		} finally {
			setIsSaving(false);
		}
	};

	const handleCancelEdit = () => {
		setEditedPages(new Map());
		setEditedTitle(undefined);
		setIsEditMode(false);
		setShowCancelModal(false);
		posthog?.capture('story_edit_cancelled', {
			story_id: id,
			story_title: story?.title,
		});
	};

	// Loading state
	if (loading) {
		return (
			<SafeAreaView style={styles.safeArea} edges={['top']}>
				<StoryLoadingSkeleton />
			</SafeAreaView>
		);
	}

	// Not found state
	if (!story) {
		return (
			<SafeAreaView style={styles.safeArea} edges={['top']}>
				<View style={styles.container}>
					<Text>Geschichte nicht gefunden</Text>
				</View>
			</SafeAreaView>
		);
	}

	// Calculate display page number (for UI)
	const displayPageNumber = currentPage === 0 ? 1 : currentPage;
	const shouldShowPageNumber = !isEndScreen && currentPage > 0;

	// Get time of day theme for end screen background
	const timeOfDay = getTimeOfDay();
	const theme = getTimeOfDayTheme(timeOfDay);

	return (
		<View style={styles.outerContainer}>
			{/* End Screen Background - fullscreen behind everything with fade animation */}
			<Animated.View style={[styles.endScreenBackgroundContainer, { opacity: backgroundFadeAnim }]}>
				<TimeOfDayBackground
					theme={theme}
					showParticles={true}
					showPattern={true}
					particleIntensity="medium"
				/>
			</Animated.View>

			<SafeAreaView style={styles.safeArea} edges={['top']}>
				{/* Archive Confirmation Modal */}
				<Modal
					visible={showArchiveModal}
					onClose={() => setShowArchiveModal(false)}
					title="Geschichte archivieren?"
					buttons={[
						{
							title: 'Abbrechen',
							onPress: () => setShowArchiveModal(false),
							variant: 'primary',
							color: '#555555',
						},
						{
							title: 'Archivieren',
							onPress: confirmArchive,
							variant: 'primary',
							color: '#ff4444',
							iconName: 'archivebox',
							iconSet: 'sf-symbols',
							iconPosition: 'left',
						},
					]}
				>
					<Text variant="body" color="#fff" style={styles.modalText}>
						Möchtest du "{story?.title}" wirklich archivieren? Die Geschichte wird dann nur noch im
						Archiv sichtbar sein.
					</Text>
				</Modal>

				{/* Cancel Edit Confirmation Modal */}
				<Modal
					visible={showCancelModal}
					onClose={() => setShowCancelModal(false)}
					title="Änderungen verwerfen?"
					buttons={[
						{
							title: 'Weiter bearbeiten',
							onPress: () => setShowCancelModal(false),
							variant: 'primary',
							color: '#555555',
						},
						{
							title: 'Verwerfen',
							onPress: handleCancelEdit,
							variant: 'primary',
							color: '#ff4444',
							iconName: 'xmark',
							iconSet: 'sf-symbols',
							iconPosition: 'left',
						},
					]}
				>
					<Text variant="body" color="#fff" style={styles.modalText}>
						Du hast ungespeicherte Änderungen. Möchtest du diese wirklich verwerfen?
					</Text>
				</Modal>

				{/* Floating Header */}
				<Animated.View style={[styles.headerContainer, { opacity: fadeAnim }]}>
					<BlurView intensity={250} tint="dark" style={styles.blurContainer}>
						<View style={styles.customHeader}>
							<TouchableOpacity
								onPress={() => router.back()}
								style={styles.backButton}
								hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
							>
								<Ionicons name="chevron-back" size={28} color="#ffffff" />
							</TouchableOpacity>

							<View style={styles.spacer} />

							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								style={styles.buttonScrollView}
								contentContainerStyle={styles.buttonScrollContent}
								onTouchStart={showHeader}
								onScrollBeginDrag={showHeader}
								onScrollEndDrag={startFadeOutTimer}
							>
								<Button
									title={isOwnStory ? 'Favorit' : 'Liken'}
									onPress={() => handleVote(id as string)}
									iconName={
										isOwnStory
											? isFavorite
												? 'heart.fill'
												: 'heart'
											: userVoted
												? 'heart.fill'
												: 'heart'
									}
									iconSet="sf-symbols"
									iconPosition="left"
									variant="tonal"
									size={buttonSize}
									color={
										isOwnStory
											? isFavorite
												? '#FFD700'
												: '#ffffff'
											: userVoted
												? '#FFD700'
												: '#ffffff'
									}
									style={styles.headerButton}
									contentContainerStyle={styles.headerButtonContent}
								/>
								{isOwnStory && (
									<Button
										title={isSaving ? 'Speichert...' : isEditMode ? 'Speichern' : 'Bearbeiten'}
										onPress={isEditMode ? handleSaveChanges : handleEditPress}
										iconName={isEditMode ? 'checkmark' : 'pencil'}
										iconSet="sf-symbols"
										iconPosition="left"
										variant="tonal"
										size={buttonSize}
										color={isEditMode ? '#4CAF50' : '#ffffff'}
										disabled={isSaving}
										style={styles.headerButton}
										contentContainerStyle={styles.headerButtonContent}
									/>
								)}
								<Button
									title="Archivieren"
									onPress={handleArchivePress}
									iconName="archivebox"
									iconSet="sf-symbols"
									iconPosition="left"
									variant="tonal"
									size={buttonSize}
									color="#ffffff"
									style={styles.headerButton}
									contentContainerStyle={styles.headerButtonContent}
								/>
							</ScrollView>
						</View>
					</BlurView>
				</Animated.View>

				{/* Page Number Indicator */}
				{shouldShowPageNumber && (
					<View style={styles.pageNumberContainer}>
						<Text
							variant="caption"
							color="#FFFFFF"
							style={[styles.pageNumberText, { fontSize: pageNumberFontSize }]}
						>
							{displayPageNumber} / {story.pages.length}
						</Text>
					</View>
				)}

				{/* Story Viewer */}
				<View style={styles.container}>
					<StoryViewer
						title={story.title}
						characterName={story.characterName}
						pages={story.pages}
						onPageChange={handlePageChange}
						onTap={showHeader}
						onEnd={handleEndPress}
						onRestart={handleRestartPress}
						onArchive={handleArchivePress}
						isEditMode={isEditMode}
						onPageTextChange={handlePageTextChange}
						onTitleChange={handleTitleChange}
						onCancelEdit={handleCancelPageEdit}
						onSaveEdit={handleSavePageEdit}
						editedPages={editedPages}
						editedTitle={editedTitle}
					/>
				</View>
			</SafeAreaView>
		</View>
	);
}

const styles = StyleSheet.create({
	outerContainer: {
		flex: 1,
		backgroundColor: '#121212',
	},
	safeArea: {
		flex: 1,
		backgroundColor: 'transparent',
	},
	endScreenBackgroundContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		width: '100%',
		height: '100%',
		zIndex: 0,
	},
	container: {
		flex: 1,
		width: '100%',
		zIndex: 1,
	},
	headerContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		zIndex: 10,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
	},
	blurContainer: {
		paddingVertical: 16,
		paddingHorizontal: 16,
		paddingTop:
			Platform.OS === 'web'
				? 16
				: Platform.OS === 'ios'
					? (() => {
							const { height, width } = Dimensions.get('window');
							return height / width > 1.8 || height >= 812 ? 48 : 24;
						})()
					: 48,
	},
	customHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		height: 48,
		width: '100%',
		backgroundColor: 'transparent',
		alignSelf: 'center',
		paddingHorizontal: 0,
		marginTop: 8,
	},
	backButton: {
		width: 40,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 20,
		backgroundColor: 'rgba(255, 255, 255, 0.00)',
		marginLeft: -8,
	},
	iconButton: {
		width: 40,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 20,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
	},
	spacer: {
		flex: 1,
	},
	buttonScrollView: {
		flexGrow: 0,
		flexShrink: 1,
		marginRight: -16,
		paddingRight: 16,
	},
	buttonScrollContent: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		paddingRight: 16,
	},
	headerButton: {
		backgroundColor: 'rgba(255, 255, 255, 0.15)',
		borderColor: 'rgba(255, 255, 255, 0.2)',
		flexShrink: 0,
	},
	headerButtonContent: {
		width: undefined,
	},
	modalText: {
		fontSize: 16,
		textAlign: 'left',
		lineHeight: 24,
		width: '100%',
	},
	pageNumberContainer: {
		position: 'absolute',
		bottom: 24,
		right: 24,
		paddingVertical: 8,
		paddingHorizontal: 16,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		borderRadius: 20,
		zIndex: 10,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.3,
		shadowRadius: 3,
	},
	pageNumberText: {
		fontWeight: '600',
	},
});
