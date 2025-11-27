import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	Pressable,
	ScrollView,
	Dimensions,
	StatusBar,
	ActivityIndicator,
	SafeAreaView,
	Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { useAppTheme } from '../theme/ThemeProvider';
import { useAuth } from '../context/AuthProvider';
import { getConversations } from '../services/conversation';

const DRAWER_WIDTH = 260; // Breite des Drawer-Menüs

interface CustomDrawerProps {
	isVisible: boolean;
	focusInputOnHomeNavigate?: () => void;
	onClose?: () => void;
}

export default function CustomDrawer({
	isVisible,
	focusInputOnHomeNavigate,
	onClose,
}: CustomDrawerProps) {
	const { colors } = useTheme();
	const { isDarkMode } = useAppTheme();
	const router = useRouter();
	const { user, signOut } = useAuth();

	const [recentChats, setRecentChats] = useState<{ id: string; title: string }[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Lade die letzten Chats
	useEffect(() => {
		const loadRecentChats = async () => {
			if (!user || !isVisible) return;

			setIsLoading(true);
			try {
				const conversations = await getConversations(user.id);

				// Nimm nur die letzten 10 Konversationen
				const recentOnes = conversations.slice(0, 10).map((conv) => ({
					id: conv.id,
					title: conv.title || 'Unbenannte Konversation',
				}));

				setRecentChats(recentOnes);
			} catch (error) {
				console.error('Fehler beim Laden der letzten Chats:', error);
			} finally {
				setIsLoading(false);
			}
		};

		if (isVisible) {
			loadRecentChats();
		}
	}, [user, isVisible]);

	// Navigation zum Home-Screen (mit Input-Fokus)
	const navigateToHome = () => {
		router.push('/');
		if (focusInputOnHomeNavigate) {
			// Verzögerung, um sicherzustellen, dass der Bildschirm geladen ist
			setTimeout(() => {
				focusInputOnHomeNavigate();
			}, 100);
		}
	};

	// Navigation zu einer Konversation
	const navigateToConversation = (id: string) => {
		router.push(`/conversation/${id}`);
	};

	// Navigation zur Archiv-Seite
	const navigateToArchive = () => {
		router.push('/archive');
	};

	// Navigation zur Vorlagen-Seite
	const navigateToTemplates = () => {
		router.push('/templates');
	};

	// Navigation zur Dokumente-Seite
	const navigateToDocuments = () => {
		router.push('/documents');
	};

	// Navigation zur Profilseite
	const navigateToProfile = () => {
		router.push('/profile');
	};

	// Styling für das Drawer-Menü
	const bgColor = isDarkMode ? '#1C1C1E' : '#FFFFFF';
	const textColor = isDarkMode ? '#FFFFFF' : '#000000';
	const separatorColor = isDarkMode ? '#38383A' : '#E5E5EA';
	const activeColor = '#0A84FF';

	// Wenn der Drawer nicht sichtbar sein soll, gib nichts zurück
	if (!isVisible) {
		return null;
	}

	return (
		<SafeAreaView
			style={[
				styles.drawer,
				{
					backgroundColor: bgColor,
					width: DRAWER_WIDTH,
					borderRightWidth: 1,
					borderRightColor: separatorColor,
				},
			]}
		>
			{/* Drawer-Header */}
			<View style={styles.drawerHeader}>
				<Text style={[styles.drawerTitle, { color: textColor }]}>Menu</Text>
				<Pressable
					onPress={onClose}
					style={({ pressed, hovered }) => [
						styles.iconButton,
						hovered && { backgroundColor: colors.menuItemHover },
					]}
				>
					{({ pressed, hovered }) => (
						<Ionicons
							name="close"
							size={24}
							color={textColor}
							style={{ opacity: pressed ? 0.7 : 1 }}
						/>
					)}
				</Pressable>
			</View>

			{/* Hauptaktionen */}
			<View style={styles.mainActions}>
				<Pressable
					style={({ pressed, hovered }) => [
						styles.mainActionButton,
						{ backgroundColor: activeColor },
						pressed && { opacity: 0.85 },
					]}
					onPress={navigateToHome}
				>
					<Ionicons name="add-circle-outline" size={20} color="white" />
					<Text style={styles.mainActionText}>Neuen Chat starten</Text>
				</Pressable>

				<Pressable
					style={({ pressed, hovered }) => [
						styles.mainActionButton,
						{
							backgroundColor: hovered ? colors.buttonHover : 'transparent',
							borderWidth: 1,
							borderColor: isDarkMode ? '#38383A' : '#D1D1D6',
							marginTop: 8,
						},
						pressed && { opacity: 0.8 },
					]}
					onPress={navigateToArchive}
				>
					<Ionicons name="archive-outline" size={20} color={textColor} />
					<Text style={[styles.mainActionText, { color: textColor }]}>Archiv ansehen</Text>
				</Pressable>

				<Pressable
					style={({ pressed, hovered }) => [
						styles.mainActionButton,
						{
							backgroundColor: hovered ? colors.buttonHover : 'transparent',
							borderWidth: 1,
							borderColor: isDarkMode ? '#38383A' : '#D1D1D6',
							marginTop: 8,
						},
						pressed && { opacity: 0.8 },
					]}
					onPress={() => router.push('/conversations')}
				>
					<Ionicons name="chatbubbles-outline" size={20} color={textColor} />
					<Text style={[styles.mainActionText, { color: textColor }]}>Konversationen</Text>
				</Pressable>

				<Pressable
					style={({ pressed, hovered }) => [
						styles.mainActionButton,
						{
							backgroundColor: hovered ? colors.buttonHover : 'transparent',
							borderWidth: 1,
							borderColor: isDarkMode ? '#38383A' : '#D1D1D6',
							marginTop: 8,
						},
						pressed && { opacity: 0.8 },
					]}
					onPress={navigateToDocuments}
				>
					<Ionicons name="document-text-outline" size={20} color={textColor} />
					<Text style={[styles.mainActionText, { color: textColor }]}>Dokumente ansehen</Text>
				</Pressable>

				<Pressable
					style={({ pressed, hovered }) => [
						styles.mainActionButton,
						{
							backgroundColor: hovered ? colors.buttonHover : 'transparent',
							borderWidth: 1,
							borderColor: isDarkMode ? '#38383A' : '#D1D1D6',
							marginTop: 8,
						},
						pressed && { opacity: 0.8 },
					]}
					onPress={navigateToTemplates}
				>
					<Ionicons name="file-tray-full-outline" size={20} color={textColor} />
					<Text style={[styles.mainActionText, { color: textColor }]}>Vorlagen verwalten</Text>
				</Pressable>

				<Pressable
					style={({ pressed, hovered }) => [
						styles.mainActionButton,
						{
							backgroundColor: hovered ? colors.buttonHover : 'transparent',
							borderWidth: 1,
							borderColor: isDarkMode ? '#38383A' : '#D1D1D6',
							marginTop: 8,
						},
						pressed && { opacity: 0.8 },
					]}
					onPress={() => router.push('/spaces')}
				>
					<Ionicons name="people-outline" size={20} color={textColor} />
					<Text style={[styles.mainActionText, { color: textColor }]}>Spaces</Text>
				</Pressable>

				<Pressable
					style={({ pressed, hovered }) => [
						styles.mainActionButton,
						{
							backgroundColor: hovered ? colors.buttonHover : 'transparent',
							borderWidth: 1,
							borderColor: isDarkMode ? '#38383A' : '#D1D1D6',
							marginTop: 8,
						},
						pressed && { opacity: 0.8 },
					]}
					onPress={navigateToProfile}
				>
					<Ionicons name="person-outline" size={20} color={textColor} />
					<Text style={[styles.mainActionText, { color: textColor }]}>Profil & Statistiken</Text>
				</Pressable>
			</View>

			{/* Trennlinie */}
			<View style={[styles.separator, { backgroundColor: separatorColor }]} />

			{/* Letzte Chats */}
			<View style={styles.recentChatsHeader}>
				<Text style={[styles.recentChatsTitle, { color: textColor }]}>Letzte Chats</Text>
			</View>

			{/* Liste der letzten Chats */}
			{isLoading ? (
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="small" color={activeColor} />
					<Text style={[styles.loadingText, { color: textColor + '80' }]}>
						Chats werden geladen...
					</Text>
				</View>
			) : (
				<ScrollView style={styles.recentChatsList}>
					{recentChats.length > 0 ? (
						recentChats.map((chat) => (
							<Pressable
								key={chat.id}
								style={({ pressed, hovered }) => [
									styles.chatItem,
									hovered && { backgroundColor: colors.menuItemHover },
									pressed && { opacity: 0.7 },
								]}
								onPress={() => navigateToConversation(chat.id)}
							>
								{({ pressed, hovered }) => (
									<>
										<Ionicons
											name="chatbubble-ellipses-outline"
											size={20}
											color={textColor + '99'}
											style={styles.chatIcon}
										/>
										<Text
											style={[styles.chatTitle, { color: textColor }]}
											numberOfLines={1}
											ellipsizeMode="tail"
										>
											{chat.title}
										</Text>
									</>
								)}
							</Pressable>
						))
					) : (
						<View style={styles.emptyChatsContainer}>
							<Text style={[styles.emptyChatsText, { color: textColor + '80' }]}>
								Keine Chats vorhanden
							</Text>
						</View>
					)}
				</ScrollView>
			)}

			{/* Benutzerinformationen und Logout-Button */}
			<View style={styles.userSection}>
				<View style={styles.separator} />
				<View style={styles.userContainer}>
					{user && (
						<View style={styles.userInfo}>
							<Ionicons name="person-circle-outline" size={24} color={textColor} />
							<Text style={[styles.userEmail, { color: textColor }]}>{user.email}</Text>
						</View>
					)}
					<Pressable
						style={({ pressed, hovered }) => [
							styles.logoutButton,
							{ borderColor: separatorColor },
							hovered && { backgroundColor: colors.dangerHover },
							pressed && { opacity: 0.8 },
						]}
						onPress={() => {
							signOut().then(() => router.replace('/auth/login'));
						}}
					>
						{({ pressed, hovered }) => (
							<>
								<Ionicons name="log-out-outline" size={20} color={textColor} />
								<Text style={[styles.logoutText, { color: textColor }]}>Abmelden</Text>
							</>
						)}
					</Pressable>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	drawer: {
		height: '100%',
		elevation: 5,
		shadowColor: '#000',
		shadowOffset: { width: 2, height: 0 },
		shadowOpacity: 0.3,
		shadowRadius: 4,
	},
	drawerHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 16,
	},
	drawerTitle: {
		fontSize: 22,
		fontWeight: 'bold',
	},
	iconButton: {
		width: 36,
		height: 36,
		borderRadius: 18,
		alignItems: 'center',
		justifyContent: 'center',
	},
	mainActions: {
		paddingHorizontal: 20,
		paddingVertical: 16,
	},
	mainActionButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 12,
		borderRadius: 8,
	},
	mainActionText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '500',
		marginLeft: 8,
	},
	separator: {
		height: 1,
		marginVertical: 8,
	},
	recentChatsHeader: {
		paddingHorizontal: 20,
		paddingVertical: 12,
	},
	recentChatsTitle: {
		fontSize: 16,
		fontWeight: '600',
	},
	recentChatsList: {
		flex: 1,
	},
	chatItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 20,
		paddingVertical: 12,
		borderRadius: 8,
		marginHorizontal: 8,
	},
	chatIcon: {
		marginRight: 12,
	},
	chatTitle: {
		fontSize: 15,
		flex: 1,
	},
	loadingContainer: {
		padding: 20,
		alignItems: 'center',
	},
	loadingText: {
		marginTop: 8,
		fontSize: 14,
	},
	emptyChatsContainer: {
		padding: 20,
		alignItems: 'center',
	},
	emptyChatsText: {
		fontSize: 14,
	},
	userSection: {
		paddingHorizontal: 20,
		paddingVertical: 16,
		marginTop: 'auto',
	},
	userContainer: {
		marginTop: 10,
	},
	userInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
	},
	userEmail: {
		fontSize: 14,
		marginLeft: 8,
	},
	logoutButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 10,
		borderRadius: 8,
		borderWidth: 1,
		marginTop: 4,
	},
	logoutText: {
		fontSize: 15,
		fontWeight: '500',
		marginLeft: 8,
	},
});
