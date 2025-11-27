import React, { useEffect, useState, useCallback } from 'react';
import {
	View,
	TouchableOpacity,
	Text,
	Modal,
	SafeAreaView,
	Alert,
	Platform,
	ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getDeckSlides, getDeck, deleteSlide, reorderSlide } from '../../services/firestore';
import { Slide, Deck } from '../../types/models';
import { SlideList } from '../../components/slides/SlideList';
import { SlideEditor } from '../../components/slides/SlideEditor';
import { PresentationMode } from '../../components/presentation/PresentationMode';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '../../components/ThemeProvider';
import { Header } from '../../components/Menu/Header';

export default function DeckScreen() {
	const { theme } = useTheme();
	const { id } = useLocalSearchParams();
	const router = useRouter();
	const [slides, setSlides] = useState<Slide[]>([]);
	const [deck, setDeck] = useState<Deck | null>(null);
	const [loading, setLoading] = useState(true);
	const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
	const [editingSlide, setEditingSlide] = useState<Slide | null>(null);
	const [isPresentationMode, setIsPresentationMode] = useState(false);
	const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

	const loadDeckAndSlides = async () => {
		try {
			const [deckData, deckSlides] = await Promise.all([
				getDeck(id as string),
				getDeckSlides(id as string),
			]);
			console.log(
				'[DeckScreen] Loaded slides:',
				deckSlides.map((s) => ({
					id: s.id.substring(0, 4),
					order: s.order,
					updatedAt: s.updatedAt,
				}))
			);
			setDeck(deckData);
			const sortedSlides = deckSlides.sort((a, b) => a.order - b.order);
			console.log(
				'[DeckScreen] Sorted slides:',
				sortedSlides.map((s) => ({
					id: s.id.substring(0, 4),
					order: s.order,
					updatedAt: s.updatedAt,
				}))
			);
			setSlides(sortedSlides);
		} catch (error) {
			console.error('Error loading deck data:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleStartPresentation = useCallback(() => {
		if (slides.length > 0) {
			setIsPresentationMode(true);
		}
	}, [slides.length]);

	const handleDeckDelete = useCallback(() => {
		setIsDeleteModalVisible(true);
	}, []);

	const handleEditSlide = useCallback((slide: Slide) => {
		setEditingSlide(slide);
		setIsCreateModalVisible(true);
	}, []);

	const handleDeleteDeck = async () => {
		if (!id) return;

		try {
			setLoading(true);
			// await deleteDeck(id as string, setId as string);
			router.back();
		} catch (error) {
			console.error('[DeckScreen] Error deleting deck:', error);
			// setError('Failed to delete deck');
		} finally {
			setLoading(false);
			setIsDeleteModalVisible(false);
		}
	};

	const handleDeleteSlide = useCallback(
		async (slide: Slide) => {
			try {
				await deleteSlide(slide.id, id as string);
				await loadDeckAndSlides();
			} catch (error) {
				console.error('[DeckScreen] Error deleting slide:', error);
				Alert.alert('Error', 'Failed to delete slide');
			}
		},
		[loadDeckAndSlides, id]
	);

	const handleMoveSlide = useCallback(
		async (slide: Slide, direction: 'up' | 'down') => {
			console.log('[DeckScreen] Starting handleMoveSlide:', {
				slideId: slide.id.substring(0, 4),
				direction,
				currentOrder: slide.order,
			});
			const currentIndex = slides.findIndex((s) => s.id === slide.id);
			console.log(
				'[DeckScreen] Current slide index:',
				currentIndex,
				'Total slides:',
				slides.length
			);
			console.log(
				'[DeckScreen] All slides:',
				slides.map((s) => ({
					id: s.id.substring(0, 4),
					order: s.order,
				}))
			);
			if (currentIndex === -1) {
				console.log('[DeckScreen] Slide not found in array');
				return;
			}

			// Normalize all orders to be integers between 1 and slides.length
			const normalizedSlides = [...slides].sort((a, b) => a.order - b.order);
			const normalizedOrders = new Map(normalizedSlides.map((s, i) => [s.id, i + 1]));

			let newOrder;
			if (direction === 'up' && currentIndex > 0) {
				// Moving up: use the previous slide's normalized order
				const prevOrder = normalizedOrders.get(slides[currentIndex - 1].id) || 1;
				const currOrder = normalizedOrders.get(slide.id) || 2;
				newOrder = prevOrder + (currOrder - prevOrder) / 2;

				console.log('[DeckScreen] Moving up - New order:', {
					newOrder,
					previousSlideId: slides[currentIndex - 1].id.substring(0, 4),
					previousOrder: prevOrder,
					currentSlideId: slides[currentIndex].id.substring(0, 4),
					currentOrder: currOrder,
				});
			} else if (direction === 'down' && currentIndex < slides.length - 1) {
				// Moving down: use the next slide's normalized order
				const currOrder = normalizedOrders.get(slide.id) || 1;
				const nextOrder = normalizedOrders.get(slides[currentIndex + 1].id) || 2;
				newOrder = currOrder + (nextOrder - currOrder) / 2;

				console.log('[DeckScreen] Moving down - New order:', {
					newOrder,
					nextSlideId: slides[currentIndex + 1].id.substring(0, 4),
					nextOrder: nextOrder,
					currentSlideId: slides[currentIndex].id.substring(0, 4),
					currentOrder: currOrder,
				});
			} else {
				console.log('[DeckScreen] Cannot move slide:', {
					direction,
					currentIndex,
					slidesLength: slides.length,
				});
				return;
			}

			try {
				console.log('[DeckScreen] Calling reorderSlide with:', {
					slideId: slide.id.substring(0, 4),
					newOrder,
					deckId: id,
				});
				await reorderSlide(slide.id, newOrder, id as string);
				console.log('[DeckScreen] Reorder successful, reloading slides');
				await loadDeckAndSlides();
			} catch (error) {
				console.error('[DeckScreen] Error moving slide:', error);
				Alert.alert('Error', 'Failed to move slide');
			}
		},
		[slides, loadDeckAndSlides, id]
	);

	useEffect(() => {
		loadDeckAndSlides();
	}, [id]);

	useEffect(() => {
		if (deck) {
			router.setParams({
				deckName: deck.name,
				slideCount: slides.length,
				onStartPresentation: handleStartPresentation,
				onDeleteDeck: handleDeckDelete,
			});
		}
	}, [deck, slides, handleStartPresentation, handleDeckDelete]);

	if (loading) {
		return (
			<View
				style={{
					flex: 1,
					justifyContent: 'center',
					alignItems: 'center',
					backgroundColor: 'transparent',
				}}
			>
				<Text style={{ fontSize: 18, fontWeight: '500', color: theme.colors.textPrimary }}>
					Loading slides...
				</Text>
			</View>
		);
	}

	return (
		<View style={{ flex: 1, backgroundColor: 'transparent' }}>
			<SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.backgroundPage }}>
				<View style={{ flex: 1 }}>
					<SlideList
						slides={slides}
						onEditSlide={handleEditSlide}
						onDeleteSlide={handleDeleteSlide}
						onMoveSlide={handleMoveSlide}
					/>
					<Header
						title={deck?.name || 'Loading...'}
						showPresent={true}
						onPresentPress={handleStartPresentation}
						disabled={!slides.length}
						slideCount={slides.length}
						position="bottom"
					/>
				</View>
				<Modal
					visible={isCreateModalVisible}
					animationType="fade"
					transparent={true}
					onRequestClose={() => {
						setIsCreateModalVisible(false);
						setEditingSlide(null);
					}}
				>
					<SafeAreaView style={{ flex: 1, backgroundColor: `${theme.colors.backgroundPrimary}CC` }}>
						<View
							style={{
								flex: 1,
								margin: 16,
								backgroundColor: theme.colors.backgroundPrimary,
								borderRadius: 12,
								overflow: 'hidden',
								maxWidth: 800,
								alignSelf: 'center',
								width: '100%',
							}}
						>
							<View
								style={{
									flexDirection: 'row',
									justifyContent: 'space-between',
									alignItems: 'center',
									padding: 16,
									borderBottomWidth: 1,
									borderBottomColor: theme.colors.borderPrimary,
								}}
							>
								<Text style={{ fontSize: 20, fontWeight: '600', color: theme.colors.textPrimary }}>
									{editingSlide ? 'Edit Slide' : 'Create New Slide'}
								</Text>
								<TouchableOpacity
									style={{
										padding: 8,
										borderRadius: 8,
										backgroundColor: theme.colors.backgroundSecondary,
									}}
									onPress={() => {
										setIsCreateModalVisible(false);
										setEditingSlide(null);
									}}
								>
									<MaterialIcons name="close" size={24} color={theme.colors.textPrimary} />
								</TouchableOpacity>
							</View>
							<ScrollView style={{ flex: 1 }}>
								<View style={{ padding: 16 }}>
									<SlideEditor
										deckId={id as string}
										slide={editingSlide}
										onSuccess={() => {
											setIsCreateModalVisible(false);
											setEditingSlide(null);
											loadDeckAndSlides();
										}}
										onCancel={() => {
											setIsCreateModalVisible(false);
											setEditingSlide(null);
										}}
									/>
								</View>
							</ScrollView>
						</View>
					</SafeAreaView>
				</Modal>

				<Modal
					visible={isDeleteModalVisible}
					animationType="fade"
					transparent={true}
					onRequestClose={() => setIsDeleteModalVisible(false)}
				>
					<View
						style={{
							flex: 1,
							justifyContent: 'center',
							alignItems: 'center',
							backgroundColor: `${theme.colors.backgroundPrimary}CC`,
						}}
					>
						<View
							style={{
								width: '90%',
								maxWidth: 600,
								borderRadius: 12,
								padding: 20,
								backgroundColor: theme.colors.backgroundPrimary,
							}}
						>
							<Text style={{ fontSize: 20, fontWeight: '600', color: theme.colors.textPrimary }}>
								Delete Slide
							</Text>
							<Text style={{ fontSize: 16, marginBottom: 20, color: theme.colors.textSecondary }}>
								Are you sure you want to delete this slide? This action cannot be undone.
							</Text>
							<View
								style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}
							>
								<TouchableOpacity
									style={{
										paddingVertical: 8,
										paddingHorizontal: 16,
										borderRadius: 8,
										backgroundColor: theme.colors.backgroundSecondary,
									}}
									onPress={() => {
										setIsDeleteModalVisible(false);
										setEditingSlide(null);
									}}
								>
									<Text
										style={{ fontSize: 16, fontWeight: '500', color: theme.colors.textPrimary }}
									>
										Cancel
									</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={{
										paddingVertical: 8,
										paddingHorizontal: 16,
										borderRadius: 8,
										backgroundColor: theme.colors.error,
									}}
									onPress={handleDeleteSlide}
								>
									<Text
										style={{ fontSize: 16, fontWeight: '500', color: theme.colors.textOnPrimary }}
									>
										Delete
									</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				</Modal>

				<Modal
					visible={isPresentationMode}
					animationType="fade"
					transparent={false}
					onRequestClose={() => setIsPresentationMode(false)}
					statusBarTranslucent={true}
				>
					<View style={{ flex: 1, backgroundColor: theme.colors.backgroundPage }}>
						<PresentationMode slides={slides} onClose={() => setIsPresentationMode(false)} />
					</View>
				</Modal>
			</SafeAreaView>
		</View>
	);
}
