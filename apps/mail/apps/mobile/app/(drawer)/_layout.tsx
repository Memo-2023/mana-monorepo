import { Drawer } from 'expo-router/drawer';
import { useTheme } from '@react-navigation/native';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '~/context/AuthProvider';
import { useEmailsStore } from '~/store/emailsStore';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';

function CustomDrawerContent(props: any) {
	const { colors } = useTheme();
	const router = useRouter();
	const { user, signOut } = useAuth();
	const { folders, selectedFolderId, selectFolder } = useEmailsStore();

	const handleLogout = async () => {
		await signOut();
		router.replace('/auth/login');
	};

	return (
		<View style={{ flex: 1 }}>
			<DrawerContentScrollView {...props}>
				{/* User info */}
				<View style={[styles.userSection, { borderBottomColor: colors.border }]}>
					<View style={[styles.avatar, { backgroundColor: colors.primary }]}>
						<Text style={styles.avatarText}>{user?.email?.charAt(0).toUpperCase() || 'U'}</Text>
					</View>
					<Text style={[styles.userEmail, { color: colors.text }]} numberOfLines={1}>
						{user?.email || 'User'}
					</Text>
				</View>

				{/* Main navigation */}
				<DrawerItemList {...props} />

				{/* Folders section */}
				{folders.length > 0 && (
					<View style={styles.foldersSection}>
						<Text style={[styles.sectionTitle, { color: colors.text + '80' }]}>FOLDERS</Text>
						{folders
							.filter((f) => f.type === 'custom')
							.map((folder) => (
								<TouchableOpacity
									key={folder.id}
									style={[
										styles.folderItem,
										selectedFolderId === folder.id && { backgroundColor: colors.primary + '20' },
									]}
									onPress={() => {
										selectFolder(folder.id);
										router.push('/');
									}}
								>
									<Ionicons name="folder-outline" size={20} color={colors.text} />
									<Text style={[styles.folderName, { color: colors.text }]}>{folder.name}</Text>
									{folder.unreadCount > 0 && (
										<View style={[styles.badge, { backgroundColor: colors.primary }]}>
											<Text style={styles.badgeText}>{folder.unreadCount}</Text>
										</View>
									)}
								</TouchableOpacity>
							))}
					</View>
				)}
			</DrawerContentScrollView>

			{/* Bottom actions */}
			<View style={[styles.bottomSection, { borderTopColor: colors.border }]}>
				<TouchableOpacity style={styles.bottomItem} onPress={() => router.push('/settings')}>
					<Ionicons name="settings-outline" size={22} color={colors.text} />
					<Text style={[styles.bottomItemText, { color: colors.text }]}>Settings</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.bottomItem} onPress={handleLogout}>
					<Ionicons name="log-out-outline" size={22} color="#ef4444" />
					<Text style={[styles.bottomItemText, { color: '#ef4444' }]}>Sign Out</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

export default function DrawerLayout() {
	const { colors } = useTheme();

	return (
		<Drawer
			drawerContent={(props) => <CustomDrawerContent {...props} />}
			screenOptions={{
				headerStyle: { backgroundColor: colors.card },
				headerTintColor: colors.text,
				drawerStyle: { backgroundColor: colors.card },
				drawerActiveTintColor: colors.primary,
				drawerInactiveTintColor: colors.text,
			}}
		>
			<Drawer.Screen
				name="index"
				options={{
					title: 'Inbox',
					drawerIcon: ({ color, size }) => <Ionicons name="mail" size={size} color={color} />,
				}}
			/>
			<Drawer.Screen
				name="sent"
				options={{
					title: 'Sent',
					drawerIcon: ({ color, size }) => <Ionicons name="send" size={size} color={color} />,
				}}
			/>
			<Drawer.Screen
				name="drafts"
				options={{
					title: 'Drafts',
					drawerIcon: ({ color, size }) => (
						<Ionicons name="document-text" size={size} color={color} />
					),
				}}
			/>
			<Drawer.Screen
				name="starred"
				options={{
					title: 'Starred',
					drawerIcon: ({ color, size }) => <Ionicons name="star" size={size} color={color} />,
				}}
			/>
			<Drawer.Screen
				name="trash"
				options={{
					title: 'Trash',
					drawerIcon: ({ color, size }) => <Ionicons name="trash" size={size} color={color} />,
				}}
			/>
		</Drawer>
	);
}

const styles = StyleSheet.create({
	userSection: {
		padding: 16,
		borderBottomWidth: 1,
		marginBottom: 8,
	},
	avatar: {
		width: 50,
		height: 50,
		borderRadius: 25,
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 8,
	},
	avatarText: {
		color: '#fff',
		fontSize: 20,
		fontWeight: 'bold',
	},
	userEmail: {
		fontSize: 14,
	},
	foldersSection: {
		paddingTop: 16,
		paddingHorizontal: 8,
	},
	sectionTitle: {
		fontSize: 12,
		fontWeight: '600',
		paddingHorizontal: 16,
		marginBottom: 8,
	},
	folderItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderRadius: 8,
		marginBottom: 4,
	},
	folderName: {
		marginLeft: 12,
		flex: 1,
		fontSize: 15,
	},
	badge: {
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 10,
	},
	badgeText: {
		color: '#fff',
		fontSize: 12,
		fontWeight: '600',
	},
	bottomSection: {
		borderTopWidth: 1,
		paddingVertical: 8,
	},
	bottomItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		paddingHorizontal: 20,
	},
	bottomItemText: {
		marginLeft: 12,
		fontSize: 15,
	},
});
