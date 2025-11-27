import React, { useState, useEffect, useCallback } from 'react';
import {
	View,
	Text,
	StyleSheet,
	TouchableOpacity,
	SafeAreaView,
	Alert,
	ActivityIndicator,
	FlatList,
	Pressable,
	Platform,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthProvider';
import {
	getSpace,
	getSpaceMembers,
	getUserRoleInSpace,
	Space,
	SpaceMember,
} from '../../../services/space';
import { getConversations, Conversation } from '../../../services/conversation';

export default function SpaceDetailScreen() {
	const { colors } = useTheme();
	const router = useRouter();
	const { id } = useLocalSearchParams();
	const { user } = useAuth();

	const [space, setSpace] = useState<Space | null>(null);
	const [members, setMembers] = useState<SpaceMember[]>([]);
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [userRole, setUserRole] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<'conversations' | 'members'>('conversations');

	// Lade Space-Details, Mitglieder und Konversationen
	const loadSpaceData = useCallback(async () => {
		if (!user || !id) return;

		setIsLoading(true);
		try {
			// Parallele Anfragen für bessere Performance
			const [spaceData, membersData, roleData] = await Promise.all([
				getSpace(id as string),
				getSpaceMembers(id as string),
				getUserRoleInSpace(id as string, user.id),
			]);

			if (spaceData) {
				setSpace(spaceData);

				// Lade Konversationen nur, wenn der Space gefunden wurde
				const spaceConversations = await getConversations(user.id, spaceData.id);
				setConversations(spaceConversations.filter((c) => c.space_id === spaceData.id));
			} else {
				console.error('Space nicht gefunden');
				Alert.alert('Fehler', 'Der Space konnte nicht gefunden werden.');
				router.back();
				return;
			}

			setMembers(membersData);
			setUserRole(roleData);
		} catch (error) {
			console.error('Fehler beim Laden der Space-Daten:', error);
			Alert.alert('Fehler', 'Die Space-Daten konnten nicht geladen werden.');
		} finally {
			setIsLoading(false);
		}
	}, [user, id, router]);

	// Lade Daten beim ersten Rendern
	useEffect(() => {
		loadSpaceData();
	}, [loadSpaceData]);

	// Lade Daten erneut, wenn der Screen fokussiert wird
	useFocusEffect(
		useCallback(() => {
			loadSpaceData();
			return () => {};
		}, [loadSpaceData])
	);

	// Zu einer Konversation navigieren
	const handleConversationPress = (conversationId: string) => {
		router.push(`/conversation/${conversationId}`);
	};

	// Neue Konversation in diesem Space starten
	const handleNewConversation = () => {
		if (!space) return;

		router.push({
			pathname: '/model-selection',
			params: { spaceId: space.id },
		});
	};

	// Neues Mitglied einladen
	const handleInviteMember = () => {
		if (!space) return;

		router.push(`/spaces/${space.id}/invite`);
	};

	// Mitgliederliste rendern
	const renderMemberItem = ({ item }: { item: SpaceMember }) => {
		const isOwner = item.role === 'owner';

		return (
			<View
				style={[
					styles.memberItem,
					{
						backgroundColor: colors.card,
						borderColor: colors.border,
					},
				]}
			>
				<View style={[styles.memberAvatar, { backgroundColor: colors.primary }]}>
					<Text style={styles.memberInitial}>{item.user_id.substring(0, 1).toUpperCase()}</Text>
				</View>

				<View style={styles.memberContent}>
					<Text style={[styles.memberUserId, { color: colors.text }]}>
						{item.user_id.substring(0, 8)}...
					</Text>

					<View style={styles.memberMeta}>
						<View
							style={[
								styles.roleBadge,
								{
									backgroundColor: isOwner
										? colors.primary + '20'
										: item.role === 'admin'
											? colors.notification + '20'
											: colors.border + '80',
								},
							]}
						>
							<Text
								style={[
									styles.roleBadgeText,
									{
										color: isOwner
											? colors.primary
											: item.role === 'admin'
												? colors.notification
												: colors.text + '80',
									},
								]}
							>
								{isOwner
									? 'Besitzer'
									: item.role === 'admin'
										? 'Admin'
										: item.role === 'member'
											? 'Mitglied'
											: 'Zuschauer'}
							</Text>
						</View>

						<Text style={[styles.joinedDate, { color: colors.text + '70' }]}>
							{item.joined_at
								? `Beigetreten: ${new Date(item.joined_at).toLocaleDateString()}`
								: item.invitation_status === 'pending'
									? 'Einladung ausstehend'
									: 'Status: ' + item.invitation_status}
						</Text>
					</View>
				</View>
			</View>
		);
	};

	// Konversationsliste rendern
	const renderConversationItem = ({ item }: { item: Conversation }) => {
		return (
			<Pressable
				style={({ pressed, hovered }) => [
					styles.conversationItem,
					{
						backgroundColor: colors.card,
						borderColor: colors.border,
					},
					hovered && { backgroundColor: colors.cardHover },
					pressed && { opacity: 0.9 },
				]}
				onPress={() => handleConversationPress(item.id)}
			>
				{({ pressed, hovered }) => (
					<>
						<View style={styles.conversationIcon}>
							<Ionicons name="chatbubble-ellipses-outline" size={24} color={colors.primary} />
						</View>

						<View style={styles.conversationContent}>
							<Text style={[styles.conversationTitle, { color: colors.text }]} numberOfLines={1}>
								{item.title || 'Unbenannte Konversation'}
							</Text>

							<Text style={[styles.conversationDate, { color: colors.text + '70' }]}>
								{new Date(item.updated_at).toLocaleString()}
							</Text>
						</View>

						<Ionicons name="chevron-forward" size={20} color={colors.text + '50'} />
					</>
				)}
			</Pressable>
		);
	};

	if (isLoading) {
		return (
			<SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color={colors.primary} />
					<Text style={[styles.loadingText, { color: colors.text + '80' }]}>
						Space wird geladen...
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (!space) {
		return (
			<SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
				<View style={styles.errorContainer}>
					<Ionicons name="alert-circle-outline" size={64} color={colors.text + '50'} />
					<Text style={[styles.errorText, { color: colors.text }]}>Space nicht gefunden</Text>
					<TouchableOpacity
						style={[styles.backToSpacesButton, { backgroundColor: colors.primary }]}
						onPress={() => router.push('/spaces')}
					>
						<Text style={styles.backToSpacesText}>Zurück zu Spaces</Text>
					</TouchableOpacity>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
			<View style={styles.header}>
				<TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
					<Ionicons name="chevron-back" size={24} color={colors.text} />
				</TouchableOpacity>
				<Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
					{space.name}
				</Text>
			</View>

			{/* Space-Info Card */}
			<View
				style={[
					styles.spaceInfoCard,
					{
						backgroundColor: colors.card,
						borderColor: colors.border,
					},
				]}
			>
				<View style={styles.spaceInfoHeader}>
					<View style={styles.spaceInfoTitleRow}>
						<Ionicons name="people" size={24} color={colors.primary} style={styles.spaceInfoIcon} />
						<View style={styles.spaceInfoTitleContainer}>
							<Text style={[styles.spaceInfoTitle, { color: colors.text }]}>{space.name}</Text>
							<Text style={[styles.spaceInfoSubtitle, { color: colors.text + '70' }]}>
								{userRole === 'owner'
									? 'Du bist Besitzer'
									: userRole === 'admin'
										? 'Du bist Admin'
										: userRole === 'member'
											? 'Du bist Mitglied'
											: 'Du bist Zuschauer'}
							</Text>
						</View>
					</View>

					{(userRole === 'owner' || userRole === 'admin') && (
						<TouchableOpacity
							style={[styles.editButton, { backgroundColor: colors.primary + '20' }]}
							onPress={() => router.push(`/spaces/${space.id}/settings`)}
						>
							<Ionicons name="settings-outline" size={18} color={colors.primary} />
						</TouchableOpacity>
					)}
				</View>

				{space.description && (
					<Text style={[styles.spaceInfoDescription, { color: colors.text + '90' }]}>
						{space.description}
					</Text>
				)}

				<View style={styles.spaceInfoDetails}>
					<View style={styles.spaceInfoDetail}>
						<Ionicons name="people-outline" size={16} color={colors.text + '70'} />
						<Text style={[styles.spaceInfoDetailText, { color: colors.text + '70' }]}>
							{members.length} Mitglieder
						</Text>
					</View>

					<View style={styles.spaceInfoDetail}>
						<Ionicons name="calendar-outline" size={16} color={colors.text + '70'} />
						<Text style={[styles.spaceInfoDetailText, { color: colors.text + '70' }]}>
							Erstellt: {new Date(space.created_at).toLocaleDateString()}
						</Text>
					</View>
				</View>
			</View>

			{/* Tabs */}
			<View style={[styles.tabContainer, { borderBottomColor: colors.border }]}>
				<TouchableOpacity
					style={[
						styles.tabButton,
						activeTab === 'conversations' && {
							borderBottomColor: colors.primary,
							borderBottomWidth: 2,
						},
					]}
					onPress={() => setActiveTab('conversations')}
				>
					<Text
						style={[
							styles.tabButtonText,
							{ color: activeTab === 'conversations' ? colors.primary : colors.text + '70' },
						]}
					>
						Konversationen
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[
						styles.tabButton,
						activeTab === 'members' && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
					]}
					onPress={() => setActiveTab('members')}
				>
					<Text
						style={[
							styles.tabButtonText,
							{ color: activeTab === 'members' ? colors.primary : colors.text + '70' },
						]}
					>
						Mitglieder
					</Text>
				</TouchableOpacity>
			</View>

			{/* Tab-Inhalte */}
			{activeTab === 'conversations' ? (
				<View style={styles.tabContent}>
					<TouchableOpacity
						style={[styles.newButton, { backgroundColor: colors.primary }]}
						onPress={handleNewConversation}
					>
						<Ionicons name="add" size={20} color="white" />
						<Text style={styles.newButtonText}>Neue Konversation</Text>
					</TouchableOpacity>

					{conversations.length > 0 ? (
						<FlatList
							data={conversations}
							keyExtractor={(item) => item.id}
							renderItem={renderConversationItem}
							contentContainerStyle={styles.listContent}
						/>
					) : (
						<View style={styles.emptyContainer}>
							<Ionicons name="chatbubbles-outline" size={60} color={colors.text + '30'} />
							<Text style={[styles.emptyTitle, { color: colors.text }]}>Keine Konversationen</Text>
							<Text style={[styles.emptyText, { color: colors.text + '70' }]}>
								Starte eine neue Konversation in diesem Space
							</Text>
						</View>
					)}
				</View>
			) : (
				<View style={styles.tabContent}>
					{(userRole === 'owner' || userRole === 'admin') && (
						<TouchableOpacity
							style={[styles.newButton, { backgroundColor: colors.primary }]}
							onPress={handleInviteMember}
						>
							<Ionicons name="person-add" size={20} color="white" />
							<Text style={styles.newButtonText}>Mitglied einladen</Text>
						</TouchableOpacity>
					)}

					{members.length > 0 ? (
						<FlatList
							data={members}
							keyExtractor={(item) => item.id}
							renderItem={renderMemberItem}
							contentContainerStyle={styles.listContent}
						/>
					) : (
						<View style={styles.emptyContainer}>
							<Ionicons name="people-outline" size={60} color={colors.text + '30'} />
							<Text style={[styles.emptyTitle, { color: colors.text }]}>Keine Mitglieder</Text>
							<Text style={[styles.emptyText, { color: colors.text + '70' }]}>
								Lade Mitglieder zu diesem Space ein
							</Text>
						</View>
					)}
				</View>
			)}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	backButton: {
		padding: 8,
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		marginLeft: 8,
		flex: 1,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		fontSize: 16,
		marginTop: 16,
	},
	errorContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	errorText: {
		fontSize: 18,
		fontWeight: '600',
		marginVertical: 16,
	},
	backToSpacesButton: {
		paddingVertical: 10,
		paddingHorizontal: 20,
		borderRadius: 8,
		marginTop: 20,
	},
	backToSpacesText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '500',
	},
	spaceInfoCard: {
		margin: 16,
		padding: 16,
		borderRadius: 12,
		borderWidth: 1,
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
	spaceInfoHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 12,
	},
	spaceInfoTitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		flex: 1,
	},
	spaceInfoIcon: {
		marginRight: 12,
	},
	spaceInfoTitleContainer: {
		flex: 1,
	},
	spaceInfoTitle: {
		fontSize: 18,
		fontWeight: 'bold',
	},
	spaceInfoSubtitle: {
		fontSize: 14,
		marginTop: 2,
	},
	editButton: {
		padding: 8,
		borderRadius: 20,
		width: 36,
		height: 36,
		alignItems: 'center',
		justifyContent: 'center',
	},
	spaceInfoDescription: {
		fontSize: 15,
		lineHeight: 22,
		marginBottom: 16,
	},
	spaceInfoDetails: {
		flexDirection: 'row',
		flexWrap: 'wrap',
	},
	spaceInfoDetail: {
		flexDirection: 'row',
		alignItems: 'center',
		marginRight: 16,
		marginBottom: 4,
	},
	spaceInfoDetailText: {
		fontSize: 13,
		marginLeft: 6,
	},
	tabContainer: {
		flexDirection: 'row',
		borderBottomWidth: 1,
		marginBottom: 16,
	},
	tabButton: {
		flex: 1,
		paddingVertical: 12,
		alignItems: 'center',
		borderBottomWidth: 0,
	},
	tabButtonText: {
		fontSize: 16,
		fontWeight: '500',
	},
	tabContent: {
		flex: 1,
		paddingHorizontal: 16,
	},
	newButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 12,
		borderRadius: 10,
		marginBottom: 16,
	},
	newButtonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '600',
		marginLeft: 8,
	},
	listContent: {
		paddingBottom: 20,
	},
	conversationItem: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		borderRadius: 10,
		borderWidth: 1,
		marginBottom: 12,
	},
	conversationIcon: {
		marginRight: 12,
	},
	conversationContent: {
		flex: 1,
	},
	conversationTitle: {
		fontSize: 16,
		fontWeight: '500',
		marginBottom: 4,
	},
	conversationDate: {
		fontSize: 13,
	},
	memberItem: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		borderRadius: 10,
		borderWidth: 1,
		marginBottom: 10,
	},
	memberAvatar: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12,
	},
	memberInitial: {
		color: 'white',
		fontSize: 18,
		fontWeight: 'bold',
	},
	memberContent: {
		flex: 1,
	},
	memberUserId: {
		fontSize: 15,
		fontWeight: '500',
		marginBottom: 4,
	},
	memberMeta: {
		flexDirection: 'row',
		alignItems: 'center',
		flexWrap: 'wrap',
	},
	roleBadge: {
		paddingHorizontal: 8,
		paddingVertical: 3,
		borderRadius: 10,
		marginRight: 8,
	},
	roleBadgeText: {
		fontSize: 12,
		fontWeight: '500',
	},
	joinedDate: {
		fontSize: 12,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingTop: 40,
	},
	emptyTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginTop: 16,
	},
	emptyText: {
		fontSize: 14,
		textAlign: 'center',
		marginTop: 8,
	},
});
