import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
	View,
	Text,
	StyleSheet,
	FlatList,
	TouchableOpacity,
	SafeAreaView,
	Alert,
	ActivityIndicator,
	TextInput,
	Pressable,
	Platform,
	ScrollView,
} from 'react-native';
import { useTheme, useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthProvider';

import NewChatButton from '../components/NewChatButton';
import ConversationStarter, { ConversationStarterRef } from '../components/ConversationStarter';
import CustomDrawer from '../components/CustomDrawer';
import { useAppTheme } from '../theme/ThemeProvider';
import {
	getConversations,
	getMessages,
	deleteConversation,
	archiveConversation,
} from '../services/conversation';
import { getUserSpaces, Space } from '../services/space';
import { modelApi } from '../services/api';

// Typendefinitionen für Konversationen
type ConversationItem = {
	id: string;
	modelName: string;
	title: string;
	lastMessage: string;
	timestamp: Date;
	mode: 'frei' | 'geführt' | 'vorlage';
};

// Hilfsfunktion zur Formatierung des Datums
const formatDate = (date: Date) => {
	const day = date.getDate().toString().padStart(2, '0');
	const month = new Intl.DateTimeFormat('de-DE', { month: 'short' }).format(date);
	const hours = date.getHours().toString().padStart(2, '0');
	const minutes = date.getMinutes().toString().padStart(2, '0');
	return `${day}. ${month}, ${hours}:${minutes}`;
};

export default function HomeScreen() {
	const { colors } = useTheme();
	const router = useRouter();
	const { user, signOut } = useAuth();
	const [conversations, setConversations] = useState<ConversationItem[]>([]);
	const [spaces, setSpaces] = useState<Space[]>([]);
	const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingSpaces, setIsLoadingSpaces] = useState(true);
	const { isDarkMode } = useAppTheme();
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const chatInputRef = useRef<ConversationStarterRef>(null);

	// Eine Funktion, die Konversationen lädt und wiederverwendet werden kann
	// Fokussiere das Eingabefeld beim ersten Laden
	useEffect(() => {
		// Kurze Verzögerung, um sicherzustellen, dass die Komponente vollständig gerendert ist
		setTimeout(() => {
			if (chatInputRef.current) {
				chatInputRef.current.focus();
			}
		}, 300);
	}, []);

	const loadConversations = async () => {
		if (!user) return;

		setIsLoading(true);
		try {
			console.log('Lade Konversationen für User:', user.id);
			console.log('Selected Space ID:', selectedSpaceId || 'Alle Spaces');

			// Lade Konversationen des Benutzers, gefiltert nach Space wenn ausgewählt
			const userConversations = await getConversations(user.id, selectedSpaceId || undefined);
			console.log(
				`${userConversations.length} Konversationen geladen`,
				new Date().toLocaleTimeString()
			);

			// Lade für jede Konversation die letzte Nachricht und das Modell
			const conversationItems: ConversationItem[] = [];

			for (const conv of userConversations) {
				try {
					// Lade die Nachrichten der Konversation
					const messages = await getMessages(conv.id);
					// Lade das Modell über die Backend API
					const modelData = await modelApi.getModel(conv.model_id);

					// Finde die letzte Nachricht (die nicht vom System ist)
					const lastMessage = messages
						.filter((msg) => msg.sender !== 'system')
						.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

					if (lastMessage) {
						conversationItems.push({
							id: conv.id,
							modelName: modelData?.name || 'Unbekanntes Modell',
							title: conv.title || 'Unbenannte Konversation',
							lastMessage: lastMessage.message_text,
							timestamp: new Date(conv.updated_at),
							mode:
								conv.conversation_mode === 'free'
									? 'frei'
									: conv.conversation_mode === 'guided'
										? 'geführt'
										: 'vorlage',
						});
					}
				} catch (error) {
					console.error(`Fehler beim Laden der Details für Konversation ${conv.id}:`, error);
				}
			}

			setConversations(conversationItems);
		} catch (error) {
			console.error('Fehler beim Laden der Konversationen:', error);
			Alert.alert('Fehler', 'Die Konversationen konnten nicht geladen werden.');
		} finally {
			setIsLoading(false);
		}
	};

	// Lade Spaces
	const loadSpaces = useCallback(async () => {
		if (!user) return;

		setIsLoadingSpaces(true);
		try {
			const userSpaces = await getUserSpaces(user.id);
			setSpaces(userSpaces);
		} catch (error) {
			console.error('Fehler beim Laden der Spaces:', error);
		} finally {
			setIsLoadingSpaces(false);
		}
	}, [user]);

	// Lade die Konversationen beim ersten Rendern und wenn sich der User oder selectedSpaceId ändert
	useEffect(() => {
		loadConversations();
	}, [user, selectedSpaceId]);

	// Lade Spaces beim ersten Rendern
	useEffect(() => {
		loadSpaces();
	}, [loadSpaces]);

	// Lade Konversationen und Spaces erneut, wenn der Screen fokussiert wird
	useFocusEffect(
		useCallback(() => {
			if (user) {
				loadConversations();
				loadSpaces();
			}
			return () => {};
		}, [user, loadSpaces, selectedSpaceId])
	);

	// Space auswählen
	const handleSpaceSelect = (spaceId: string | null) => {
		console.log('Space ausgewählt:', spaceId);
		setSelectedSpaceId(spaceId);

		// Alert für Debug-Zwecke
		Alert.alert('Space ausgewählt', `Space ID: ${spaceId || 'Alle Spaces'}`);
	};

	const handleNewChat = () => {
		// Navigiere zum Modellauswahl-Screen
		router.push('/model-selection');
	};

	const handleLogout = async () => {
		try {
			await signOut();
			router.replace('/auth/login');
		} catch (error) {
			console.error('Fehler beim Abmelden:', error);
			Alert.alert('Fehler', 'Bei der Abmeldung ist ein Fehler aufgetreten.');
		}
	};

	const handleConversationPress = (id: string) => {
		// Navigiere zum Konversations-Screen mit der ID
		router.push(`/conversation/${id}`);
	};

	// Löschen einer Konversation
	const handleDeleteConversation = (id: string) => {
		Alert.alert(
			'Konversation löschen',
			'Möchtest du diese Konversation wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
			[
				{
					text: 'Abbrechen',
					style: 'cancel',
				},
				{
					text: 'Löschen',
					style: 'destructive',
					onPress: async () => {
						try {
							const success = await deleteConversation(id);
							if (success) {
								// Aus der lokalen Liste entfernen
								setConversations((prev) => prev.filter((conv) => conv.id !== id));
								Alert.alert('Erfolg', 'Die Konversation wurde gelöscht.');
							} else {
								Alert.alert('Fehler', 'Die Konversation konnte nicht gelöscht werden.');
							}
						} catch (error) {
							console.error('Fehler beim Löschen der Konversation:', error);
							Alert.alert('Fehler', 'Die Konversation konnte nicht gelöscht werden.');
						}
					},
				},
			]
		);
	};

	// Archivieren einer Konversation
	const handleArchiveConversation = async (id: string) => {
		try {
			const success = await archiveConversation(id);
			if (success) {
				// Aus der lokalen Liste entfernen
				setConversations((prev) => prev.filter((conv) => conv.id !== id));
				Alert.alert('Erfolg', 'Die Konversation wurde archiviert.');
			} else {
				Alert.alert('Fehler', 'Die Konversation konnte nicht archiviert werden.');
			}
		} catch (error) {
			console.error('Fehler beim Archivieren der Konversation:', error);
			Alert.alert('Fehler', 'Die Konversation konnte nicht archiviert werden.');
		}
	};

	// Zustandsverwaltung für die Optionsmenüs der Konversationselemente
	const [expandedConversationId, setExpandedConversationId] = useState<string | null>(null);

	// Toggle-Funktion für das Optionsmenü
	const toggleOptionsMenu = (id: string) => {
		setExpandedConversationId(expandedConversationId === id ? null : id);
	};

	const renderConversationItem = ({ item }: { item: ConversationItem }) => {
		const showOptions = expandedConversationId === item.id;

		return (
			<View
				style={[
					styles.conversationItemWrapper,
					{
						backgroundColor: colors.card,
						borderWidth: 1,
						borderColor: colors.border,
						shadowColor: '#000',
						shadowOffset: { width: 0, height: 2 },
						shadowOpacity: 0.1,
						shadowRadius: 4,
						elevation: 2,
					},
				]}
			>
				<Pressable
					style={({ pressed, hovered }) => [
						styles.conversationItem,
						hovered && { backgroundColor: colors.cardHover },
						pressed && { opacity: 0.9 },
					]}
					onPress={() => handleConversationPress(item.id)}
					onLongPress={() => toggleOptionsMenu(item.id)}
				>
					{({ pressed, hovered }) => (
						<>
							<View style={styles.conversationContent}>
								<View style={styles.conversationHeader}>
									<View style={styles.titleRow}>
										<Ionicons
											name="chatbubble-ellipses-outline"
											size={18}
											color={colors.primary}
											style={styles.titleIcon}
										/>
										<Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
											{item.title}
										</Text>
									</View>
								</View>

								<View style={styles.badgeContainer}>
									<View style={[styles.modelBadge, { backgroundColor: colors.primary + '15' }]}>
										<Text style={[styles.modelName, { color: colors.primary }]}>
											{item.modelName}
										</Text>
									</View>

									<View style={[styles.modeBadge, { backgroundColor: colors.muted + '30' }]}>
										<Text style={[styles.modeText, { color: colors.text + '90' }]}>
											{item.mode === 'frei'
												? 'Frei'
												: item.mode === 'geführt'
													? 'Geführt'
													: 'Vorlage'}
										</Text>
									</View>

									<Text style={[styles.timestamp, { color: colors.text + '80' }]}>
										{formatDate(item.timestamp)}
									</Text>
								</View>

								<Text style={[styles.lastMessage, { color: colors.text + 'CC' }]} numberOfLines={3}>
									{item.lastMessage}
								</Text>
							</View>

							<Pressable
								style={({ pressed, hovered }) => [
									styles.optionsButton,
									hovered && { backgroundColor: colors.menuItemHover },
									pressed && { opacity: 0.7 },
								]}
								onPress={() => toggleOptionsMenu(item.id)}
							>
								{({ pressed, hovered }) => (
									<Ionicons name="ellipsis-vertical" size={20} color={colors.text + '80'} />
								)}
							</Pressable>
						</>
					)}
				</Pressable>

				{showOptions && (
					<View
						style={[
							styles.optionsContainer,
							{
								backgroundColor: colors.card,
								borderTopWidth: 1,
								borderTopColor: colors.border,
							},
						]}
					>
						<Pressable
							style={({ pressed, hovered }) => [
								styles.optionButton,
								hovered && { backgroundColor: colors.menuItemHover },
								pressed && { opacity: 0.8 },
							]}
							onPress={() => handleArchiveConversation(item.id)}
						>
							{({ pressed, hovered }) => (
								<>
									<Ionicons name="archive-outline" size={18} color={colors.text} />
									<Text style={[styles.optionText, { color: colors.text }]}>Archivieren</Text>
								</>
							)}
						</Pressable>

						<Pressable
							style={({ pressed, hovered }) => [
								styles.optionButton,
								hovered && { backgroundColor: colors.dangerHover },
								pressed && { opacity: 0.8 },
							]}
							onPress={() => handleDeleteConversation(item.id)}
						>
							{({ pressed, hovered }) => (
								<>
									<Ionicons name="trash-outline" size={18} color="#FF3B30" />
									<Text style={[styles.optionText, { color: '#FF3B30' }]}>Löschen</Text>
								</>
							)}
						</Pressable>
					</View>
				)}
			</View>
		);
	};

	// Fokussiere das Eingabefeld, wenn der Benutzer auf "Neuen Chat starten" klickt
	const handleFocusInput = useCallback(() => {
		if (chatInputRef.current) {
			chatInputRef.current.focus();
		}
	}, [chatInputRef]);

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
			<View style={styles.mainLayout}>
				{/* Permanenter Drawer links */}
				{isDrawerOpen && (
					<View style={styles.drawerContainer}>
						<CustomDrawer
							isVisible={isDrawerOpen}
							focusInputOnHomeNavigate={handleFocusInput}
							onClose={() => setIsDrawerOpen(false)}
						/>
					</View>
				)}

				{/* Hauptinhalt */}
				<View style={styles.mainContainer}>
					<View style={styles.contentContainer}>
						<View style={styles.header}>
							<Pressable
								style={({ pressed, hovered }) => [
									styles.menuButton,
									hovered && { backgroundColor: colors.menuItemHover },
									pressed && { opacity: 0.7 },
								]}
								onPress={() => setIsDrawerOpen(!isDrawerOpen)}
								hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
							>
								{({ pressed, hovered }) => (
									<Ionicons name="menu-outline" size={28} color={colors.text} />
								)}
							</Pressable>

							<Text style={[styles.title, { color: colors.text }]}>Chats</Text>
						</View>

						{/* Space-Auswahl */}
						{spaces.length > 0 && (
							<View style={styles.spaceSelector} pointerEvents="box-none">
								<ScrollView
									horizontal
									showsHorizontalScrollIndicator={false}
									contentContainerStyle={styles.spacePills}
									pointerEvents="box-none"
								>
									<TouchableOpacity
										style={[
											styles.spacePill,
											{
												backgroundColor: selectedSpaceId === null ? colors.primary : 'transparent',
												borderColor: colors.primary,
											},
										]}
										onPress={() => handleSpaceSelect(null)}
										activeOpacity={0.7}
										hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
									>
										<Text
											style={[
												styles.spacePillText,
												{
													color: selectedSpaceId === null ? 'white' : colors.primary,
												},
											]}
										>
											Alle
										</Text>
									</TouchableOpacity>

									{spaces.map((space) => (
										<TouchableOpacity
											key={space.id}
											style={[
												styles.spacePill,
												{
													backgroundColor:
														selectedSpaceId === space.id ? colors.primary : 'transparent',
													borderColor: colors.primary,
												},
											]}
											onPress={() => handleSpaceSelect(space.id)}
											activeOpacity={0.7}
											hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
										>
											<Text
												style={[
													styles.spacePillText,
													{
														color: selectedSpaceId === space.id ? 'white' : colors.primary,
													},
												]}
											>
												{space.name}
											</Text>
										</TouchableOpacity>
									))}

									<TouchableOpacity
										style={[
											styles.spacePillAdd,
											{
												backgroundColor: 'transparent',
												borderColor: colors.primary,
												borderStyle: 'dashed',
											},
										]}
										onPress={() => router.push('/spaces')}
										activeOpacity={0.7}
										hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
									>
										<View style={styles.spacePillAddContent}>
											<Ionicons name="add" size={16} color={colors.primary} />
											<Text style={[styles.spacePillAddText, { color: colors.primary }]}>
												Verwalten
											</Text>
										</View>
									</TouchableOpacity>
								</ScrollView>
							</View>
						)}

						{/* Zentrierter ConversationStarter */}
						<View style={styles.centerContainer}>
							<ConversationStarter
								ref={chatInputRef}
								placeholder="Was möchtest du wissen?"
								spaceId={selectedSpaceId}
							/>
						</View>

						{/* Konversationsliste unten */}
						<View style={styles.bottomSection}>
							<View style={styles.sectionHeader}>
								<Text style={[styles.sectionTitle, { color: colors.text }]}>
									Letzte Konversationen
								</Text>
								{conversations.length > 0 && (
									<Pressable
										style={({ pressed, hovered }) => [
											styles.viewAllButton,
											hovered && { backgroundColor: colors.buttonHover },
											pressed && { opacity: 0.8 },
										]}
										onPress={() => router.push('/conversations')}
									>
										{({ pressed, hovered }) => (
											<Text style={[styles.viewAllText, { color: colors.primary }]}>
												Alle anzeigen
											</Text>
										)}
									</Pressable>
								)}
							</View>

							{isLoading ? (
								<View style={styles.loadingContainer}>
									<ActivityIndicator size="large" color={colors.primary} />
									<Text style={[styles.loadingText, { color: colors.text + '80' }]}>
										Konversationen werden geladen...
									</Text>
								</View>
							) : conversations.length > 0 ? (
								<FlatList
									data={conversations.slice(0, 10)} // Bis zu 10 letzte Einträge
									keyExtractor={(item) => item.id}
									renderItem={renderConversationItem}
									contentContainerStyle={styles.gridContent}
									horizontal={true}
									showsHorizontalScrollIndicator={false}
									snapToAlignment="start"
									decelerationRate="fast"
									snapToInterval={396} // 380px Kartenbreite + 16px Abstand
								/>
							) : (
								<View style={styles.emptyContainer}>
									<Ionicons name="chatbubbles-outline" size={64} color={colors.text + '40'} />
									<Text style={[styles.emptyText, { color: colors.text + '80' }]}>
										Keine Konversationen vorhanden
									</Text>
									<Text style={[styles.emptySubtext, { color: colors.text + '60' }]}>
										Stelle eine Frage im Eingabefeld oben
									</Text>
								</View>
							)}
						</View>
					</View>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	mainLayout: {
		flex: 1,
		flexDirection: 'row',
	},
	mainContainer: {
		flex: 1,
		alignItems: 'center',
	},
	drawerContainer: {
		width: 260,
		height: '100%',
		position: 'absolute',
		left: 0,
		top: 0,
		bottom: 0,
		zIndex: 10,
	},
	contentContainer: {
		flex: 1,
		maxWidth: 1200,
		width: '100%',
	},
	header: {
		paddingHorizontal: 20,
		paddingTop: 16,
		paddingBottom: 8,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		maxWidth: 800,
		width: '100%',
		alignSelf: 'center',
		zIndex: 10, // Stelle sicher, dass der Header über allem anderen liegt
		elevation: 10, // Für Android
	},
	menuButton: {
		padding: 10,
		marginRight: 8,
		zIndex: 5,
		borderRadius: 20,
		width: 40,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center',
	},
	title: {
		fontSize: 28,
		fontWeight: 'bold',
	},
	spaceSelector: {
		paddingTop: 8,
		paddingBottom: 12,
		zIndex: 20, // Erhöht, um über anderen Elementen zu liegen
		elevation: 20, // Für Android
		position: 'relative', // Setzt einen neuen Stacking-Kontext
	},
	spacePills: {
		paddingHorizontal: 16,
		gap: 8,
	},
	spacePill: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		borderWidth: 1,
		minWidth: 60,
		minHeight: 32,
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 25, // Noch höher als spaceSelector
		elevation: 25, // Für Android
	},
	spacePillText: {
		fontSize: 14,
		fontWeight: '500',
	},
	spacePillAdd: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		borderWidth: 1,
		borderStyle: 'dashed',
		minWidth: 100,
		minHeight: 32,
		justifyContent: 'center',
		alignItems: 'center',
		zIndex: 25, // Gleich wie normaler spacePill
		elevation: 25, // Für Android
	},
	spacePillAddContent: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	spacePillAddText: {
		fontSize: 14,
		fontWeight: '500',
		marginLeft: 4,
	},
	centerContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 16,
		marginTop: 20, // Erhöht, um mehr Platz für Space-Pills zu lassen
		zIndex: 10, // Zwischen Space-Selector und den Pills
	},
	bottomSection: {
		flex: 0.4, // Nimmt 40% des verfügbaren Platzes ein
		width: '100%',
	},
	gridContent: {
		paddingLeft: 16,
		paddingRight: 4, // Reduziertes Padding rechts, da die Karten marginRight haben
		paddingBottom: 20,
		paddingTop: 10,
	},
	conversationItemWrapper: {
		borderRadius: 12,
		overflow: 'hidden',
		width: 380, // Breitere Karten
		height: 180, // Feste Höhe für einheitlichere Darstellung
		marginRight: 16, // Abstand zwischen den Karten
		...Platform.select({
			ios: {
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.1,
				shadowRadius: 4,
			},
			android: {
				elevation: 3,
			},
			web: {
				boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
			},
		}),
	},
	conversationItem: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		padding: 16,
	},
	conversationContent: {
		flex: 1,
		display: 'flex',
		flexDirection: 'column',
		height: '100%',
	},
	optionsContainer: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		paddingHorizontal: 16,
		paddingBottom: 12,
		paddingTop: 8,
	},
	optionButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 12,
		paddingVertical: 6,
		marginLeft: 8,
		borderRadius: 6,
	},
	optionText: {
		fontSize: 14,
		marginLeft: 6,
		fontWeight: '500',
	},
	conversationHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 6,
	},
	titleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	titleIcon: {
		marginRight: 8,
	},
	title: {
		fontSize: 16,
		fontWeight: '600',
		flex: 1,
		marginBottom: 2,
	},
	modelName: {
		fontSize: 12,
		fontWeight: '400',
	},
	badgeContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 10,
		gap: 8,
		flexWrap: 'wrap',
	},
	modelBadge: {
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 12,
	},
	modelName: {
		fontSize: 12,
		fontWeight: '500',
	},
	modeBadge: {
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 12,
	},
	timestamp: {
		fontSize: 11,
		marginLeft: 'auto', // Um es an den rechten Rand zu schieben
	},
	lastMessage: {
		fontSize: 14,
		marginBottom: 6,
		lineHeight: 20,
		marginTop: 4,
		flex: 1, // Damit die Nachricht den verbleibenden Platz einnimmt
	},
	modeText: {
		fontSize: 11,
		fontWeight: '500',
	},
	optionsButton: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: 'center',
		justifyContent: 'center',
	},
	// Container für den Ladezustand
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 32,
		marginTop: -40,
	},
	loadingText: {
		fontSize: 16,
		marginTop: 16,
		textAlign: 'center',
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 32,
		marginTop: -80, // Nach oben verschieben, um Platz für das Eingabefeld zu machen
	},
	emptyText: {
		fontSize: 18,
		fontWeight: '600',
		marginTop: 16,
		textAlign: 'center',
	},
	emptySubtext: {
		fontSize: 14,
		textAlign: 'center',
		marginTop: 8,
	},
	userContainer: {
		flexDirection: 'column',
		alignItems: 'flex-end',
	},
	userEmail: {
		fontSize: 12,
		marginBottom: 4,
	},
	logoutButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 16,
	},
	logoutText: {
		color: 'white',
		fontSize: 12,
		marginLeft: 4,
		fontWeight: '500',
		marginTop: 8,
		textAlign: 'center',
	},
	buttonContainer: {
		position: 'absolute',
		bottom: 24,
		right: 24,
	},
	sectionHeader: {
		paddingHorizontal: 20,
		paddingTop: 12,
		paddingBottom: 4,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		maxWidth: 800,
		alignSelf: 'center',
		width: '100%',
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: '600',
	},
	viewAllButton: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
	},
	viewAllText: {
		fontSize: 14,
		fontWeight: '500',
	},
});
