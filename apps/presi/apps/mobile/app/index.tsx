import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import {
	getUserDecks,
	deleteDeck,
	getDeckSlides,
	migrateDecksToNewSchema,
} from '../services/firestore';
import { Deck, Slide } from '../types/models';
import { DeckList } from '../components/decks/DeckList';
import { CreateDeckForm } from '../components/forms/CreateDeckForm';
import { DeckShareSettings } from '../components/decks/DeckShareSettings';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ThemeProvider } from '../components/ThemeProvider';
import { useTheme } from '../components/ThemeProvider';
import { db } from '../firebaseConfig';
import { updateDoc, doc } from 'firebase/firestore';
import { ThemeVariant, THEME_PATTERNS, THEME_NAMES } from '../constants/theme';
import { CreateItemButton } from '../components/common/CreateItemButton';

function App() {
	const router = useRouter();
	const { theme, themeVariant, colorMode } = useTheme();
	const [decks, setDecks] = useState<Deck[]>([]);
	const [loading, setLoading] = useState(true);
	const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
	const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
	const [isShareModalVisible, setIsShareModalVisible] = useState(false);
	const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);
	const [deckToShare, setDeckToShare] = useState<Deck | null>(null);
	const [user, setUser] = useState<User | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [decksWithFirstSlide, setDecksWithFirstSlide] = useState<{ [key: string]: string }>({});
	const [slideCounts, setSlideCounts] = useState<{ [key: string]: number }>({});
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);

		// Listen for the create deck modal event
		const handleOpenCreateModal = () => {
			setIsCreateModalVisible(true);
		};
		window.addEventListener('openCreateDeckModal', handleOpenCreateModal);

		return () => {
			setMounted(false);
			window.removeEventListener('openCreateDeckModal', handleOpenCreateModal);
		};
	}, []);

	useEffect(() => {
		if (mounted && decks) {
			router.setParams({ deckCount: decks.length });
		}
	}, [decks, mounted]);

	useEffect(() => {
		console.log('[App] Setting up auth state listener');
		let mounted = true;

		const loadDecksForUser = async (currentUser: User) => {
			if (!currentUser || !mounted) return;

			try {
				setLoading(true);
				setError(null);

				// Migrate existing decks to new schema
				await migrateDecksToNewSchema(currentUser.uid);

				const userDecks = await getUserDecks(currentUser.uid);
				if (mounted) {
					setDecks(userDecks);

					// Load first slide for each deck
					const firstSlides: { [key: string]: string } = {};
					const counts: { [key: string]: number } = {};

					for (const deck of userDecks) {
						try {
							const slides = await getDeckSlides(deck.id);
							if (slides.length > 0) {
								firstSlides[deck.id] = slides[0].imageUrl || '';
							}
							counts[deck.id] = slides.length;
						} catch (error) {
							console.error('[Firestore] Error getting slides:', error);
						}
					}

					if (mounted) {
						setDecksWithFirstSlide(firstSlides);
						setSlideCounts(counts);
					}
				}
			} catch (error) {
				console.error('[App] Error loading decks:', error);
				if (mounted) {
					setError('Failed to load decks');
				}
			} finally {
				if (mounted) {
					setLoading(false);
				}
			}
		};

		const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
			console.log('[App] Auth state changed:', currentUser?.email);

			if (!mounted) return;

			if (currentUser) {
				setUser(currentUser);
				await loadDecksForUser(currentUser);
			} else {
				setUser(null);
				setDecks([]);
			}
		});

		return () => {
			mounted = false;
			unsubscribe();
		};
	}, []);

	const handleDeckPress = (deck: Deck) => {
		router.push(`/deck/${deck.id}`);
	};

	const handleDeckDelete = (deck: Deck) => {
		setDeckToDelete(deck);
		setIsDeleteModalVisible(true);
	};

	const handleShareDeck = (deck: Deck) => {
		setDeckToShare(deck);
		setIsShareModalVisible(true);
	};

	const confirmDelete = async () => {
		if (!deckToDelete) return;

		try {
			setLoading(true);
			await deleteDeck(deckToDelete.id);
			const updatedDecks = decks.filter((deck) => deck.id !== deckToDelete.id);
			setDecks(updatedDecks);
		} catch (error) {
			console.error('[App] Error deleting deck:', error);
			setError('Failed to delete deck');
		} finally {
			setLoading(false);
			setIsDeleteModalVisible(false);
			setDeckToDelete(null);
		}
	};

	return (
		<View style={[styles.container, { backgroundColor: theme.colors.backgroundPage }]}>
			<View style={styles.content}>
				<DeckList
					decks={decks}
					onDeckPress={(deck) => {
						router.push(`/deck/${deck.id}`);
					}}
					onCreateDeck={() => setIsCreateModalVisible(true)}
					onDeleteDeck={(deck) => {
						setDeckToDelete(deck);
						setIsDeleteModalVisible(true);
					}}
					onShareDeck={(deck) => {
						setDeckToShare(deck);
						setIsShareModalVisible(true);
					}}
					firstSlideImages={decksWithFirstSlide}
					loading={loading}
					slideCounts={slideCounts}
					onProfilePress={() => router.push('/profile')}
					onSettingsPress={() => router.push('/settings')}
					scrollPadding={{
						vertical: { top: 20, bottom: 80 },
						horizontal: { top: 200, bottom: 200 },
					}}
					deckSpacing={{ vertical: 24, horizontal: 40 }}
					headerRight={() => (
						<View style={{ flexDirection: 'row', gap: 15, marginRight: 15 }}>
							<CreateItemButton
								onPress={() => setIsCreateModalVisible(true)}
								variant="button"
								title="Create New Deck"
								buttonText="Create New Deck"
							/>
							<View style={styles.headerActions}>
								<TouchableOpacity
									onPress={() => router.push('/profile')}
									style={[styles.iconButton, { backgroundColor: theme.colors.backgroundSecondary }]}
								>
									<MaterialIcons name="account-circle" size={24} color={theme.colors.textPrimary} />
								</TouchableOpacity>
								<TouchableOpacity
									onPress={() => router.push('/settings')}
									style={[styles.iconButton, { backgroundColor: theme.colors.backgroundSecondary }]}
								>
									<MaterialIcons name="settings" size={24} color={theme.colors.textPrimary} />
								</TouchableOpacity>
							</View>
						</View>
					)}
				/>

				{/* Create Deck Modal */}
				<Modal
					visible={isCreateModalVisible}
					onRequestClose={() => setIsCreateModalVisible(false)}
					animationType="fade"
					transparent
				>
					<View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
						<View
							style={[styles.modalContainer, { backgroundColor: theme.colors.backgroundPrimary }]}
						>
							<CreateDeckForm
								userId={user?.uid || ''}
								onSuccess={(newDeck) => {
									setIsCreateModalVisible(false);
									setDecks([newDeck, ...decks]);
									router.push(`/deck/${newDeck.id}`);
								}}
								onCancel={() => setIsCreateModalVisible(false)}
							/>
						</View>
					</View>
				</Modal>

				{/* Delete Deck Modal */}
				<Modal
					visible={isDeleteModalVisible}
					onRequestClose={() => {
						setIsDeleteModalVisible(false);
						setDeckToDelete(null);
					}}
					transparent
					animationType="fade"
				>
					<View style={styles.modalOverlay}>
						<View
							style={[styles.modalContent, { backgroundColor: theme.colors.backgroundPrimary }]}
						>
							<Text style={[styles.modalTitle, { color: theme.colors.textPrimary }]}>
								Delete Deck
							</Text>
							<Text style={[styles.modalText, { color: theme.colors.textSecondary }]}>
								Are you sure you want to delete "{deckToDelete?.name}"? This action cannot be
								undone.
							</Text>
							<View style={styles.modalButtons}>
								<TouchableOpacity
									style={[
										styles.modalButton,
										{ backgroundColor: theme.colors.backgroundSecondary },
									]}
									onPress={() => {
										setIsDeleteModalVisible(false);
										setDeckToDelete(null);
									}}
								>
									<Text style={[styles.buttonText, { color: theme.colors.textPrimary }]}>
										Cancel
									</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={[styles.modalButton, { backgroundColor: theme.colors.error }]}
									onPress={confirmDelete}
								>
									<Text style={[styles.buttonText, styles.deleteButtonText]}>Delete</Text>
								</TouchableOpacity>
							</View>
						</View>
					</View>
				</Modal>

				{/* Share Deck Modal */}
				<Modal
					visible={isShareModalVisible}
					onRequestClose={() => setIsShareModalVisible(false)}
					transparent
					animationType="fade"
				>
					<View style={styles.modalOverlay}>
						<View
							style={[styles.modalContent, { backgroundColor: theme.colors.backgroundPrimary }]}
						>
							<DeckShareSettings
								deck={deckToShare!}
								onUpdateSharing={async (sharing) => {
									if (!deckToShare) return;
									try {
										await updateDoc(doc(db, 'decks', deckToShare.id), { sharing });
										// Refresh decks list
										if (user) {
											const updatedDecks = await getUserDecks(user.uid);
											setDecks(updatedDecks);
										}
										setIsShareModalVisible(false);
									} catch (error) {
										console.error('Error updating sharing settings:', error);
									}
								}}
								onClose={() => setIsShareModalVisible(false)}
							/>
						</View>
					</View>
				</Modal>

				{error && (
					<View style={styles.errorContainer}>
						<Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
					</View>
				)}
			</View>
		</View>
	);
}

export default function IndexPage() {
	return (
		<ThemeProvider>
			<App />
		</ThemeProvider>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
	},
	modalOverlay: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 16,
	},
	modalContainer: {
		width: '100%',
		maxWidth: 600,
		borderRadius: 12,
		overflow: 'hidden',
	},
	modalContent: {
		padding: 20,
		borderRadius: 8,
		width: '80%',
		maxWidth: 500,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginBottom: 10,
	},
	modalText: {
		fontSize: 16,
		marginBottom: 20,
	},
	modalButtons: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		width: '100%',
	},
	modalButton: {
		flex: 1,
		padding: 12,
		borderRadius: 8,
		marginHorizontal: 8,
	},
	buttonText: {
		textAlign: 'center',
		fontSize: 16,
		fontWeight: '600',
	},
	deleteButtonText: {
		color: '#FFFFFF',
	},
	errorContainer: {
		position: 'absolute',
		bottom: 20,
		left: 20,
		right: 20,
		padding: 10,
		borderRadius: 8,
		backgroundColor: '#FFFFFF',
		shadowColor: '#000000',
		shadowOpacity: 0.2,
		shadowRadius: 5,
		elevation: 5,
	},
	errorText: {
		fontSize: 16,
		fontWeight: '600',
	},
	headerActions: {
		flexDirection: 'row',
		gap: 10,
	},
	iconButton: {
		padding: 10,
		borderRadius: 8,
	},
});
