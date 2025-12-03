import React, { useEffect, useCallback } from 'react';
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
	RefreshControl,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '~/context/AuthProvider';
import { useEmailsStore } from '~/store/emailsStore';
import { useAppTheme } from '~/theme/ThemeProvider';

export default function InboxScreen() {
	const { colors } = useTheme();
	const { isDarkMode } = useAppTheme();
	const router = useRouter();
	const { getToken } = useAuth();
	const {
		accounts,
		selectedAccountId,
		folders,
		emails,
		loading,
		syncing,
		hasMore,
		fetchAccounts,
		fetchFolders,
		fetchEmails,
		syncAccount,
		markAsRead,
		toggleStar,
	} = useEmailsStore();

	// Initialize data
	useEffect(() => {
		const loadData = async () => {
			const token = await getToken();
			if (!token) return;

			await fetchAccounts(token);
		};
		loadData();
	}, []);

	// Fetch folders when account changes
	useEffect(() => {
		const loadFolders = async () => {
			if (!selectedAccountId) return;
			const token = await getToken();
			if (!token) return;

			await fetchFolders(selectedAccountId, token);
		};
		loadFolders();
	}, [selectedAccountId]);

	// Fetch emails when folders loaded
	useEffect(() => {
		const loadEmails = async () => {
			if (!folders.length) return;
			const token = await getToken();
			if (!token) return;

			await fetchEmails(token, true);
		};
		loadEmails();
	}, [folders]);

	const handleRefresh = useCallback(async () => {
		if (!selectedAccountId) return;
		const token = await getToken();
		if (!token) return;

		await syncAccount(selectedAccountId, token);
	}, [selectedAccountId]);

	const handleLoadMore = useCallback(async () => {
		if (loading || !hasMore) return;
		const token = await getToken();
		if (!token) return;

		await fetchEmails(token);
	}, [loading, hasMore]);

	const handleEmailPress = async (emailId: string, isRead: boolean) => {
		if (!isRead) {
			const token = await getToken();
			if (token) {
				markAsRead(emailId, token);
			}
		}
		router.push(`/email/${emailId}`);
	};

	const handleStarPress = async (emailId: string) => {
		const token = await getToken();
		if (token) {
			toggleStar(emailId, token);
		}
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

		if (diffDays === 0) {
			return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
		} else if (diffDays < 7) {
			return date.toLocaleDateString([], { weekday: 'short' });
		} else {
			return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
		}
	};

	const renderEmail = ({ item }: { item: any }) => (
		<TouchableOpacity
			style={[
				styles.emailItem,
				{ backgroundColor: colors.card },
				!item.isRead && { backgroundColor: isDarkMode ? '#1a1a2e' : '#f0f4ff' },
			]}
			onPress={() => handleEmailPress(item.id, item.isRead)}
		>
			<View style={styles.emailLeft}>
				<View style={[styles.avatar, { backgroundColor: colors.primary + '30' }]}>
					<Text style={[styles.avatarText, { color: colors.primary }]}>
						{(item.fromName || item.fromAddress)?.charAt(0).toUpperCase()}
					</Text>
				</View>
			</View>

			<View style={styles.emailContent}>
				<View style={styles.emailHeader}>
					<Text
						style={[styles.fromName, { color: colors.text }, !item.isRead && styles.unread]}
						numberOfLines={1}
					>
						{item.fromName || item.fromAddress}
					</Text>
					<Text style={[styles.date, { color: colors.text + '80' }]}>
						{formatDate(item.receivedAt || item.sentAt)}
					</Text>
				</View>
				<Text
					style={[styles.subject, { color: colors.text }, !item.isRead && styles.unread]}
					numberOfLines={1}
				>
					{item.subject || '(No Subject)'}
				</Text>
				<Text style={[styles.snippet, { color: colors.text + '80' }]} numberOfLines={1}>
					{item.snippet || ''}
				</Text>
			</View>

			<TouchableOpacity style={styles.starButton} onPress={() => handleStarPress(item.id)}>
				<Ionicons
					name={item.isStarred ? 'star' : 'star-outline'}
					size={20}
					color={item.isStarred ? '#f59e0b' : colors.text + '60'}
				/>
			</TouchableOpacity>
		</TouchableOpacity>
	);

	if (!accounts.length && loading) {
		return (
			<View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
				<ActivityIndicator size="large" color={colors.primary} />
				<Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
			</View>
		);
	}

	if (!accounts.length) {
		return (
			<View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
				<Ionicons name="mail-outline" size={64} color={colors.text + '40'} />
				<Text style={[styles.emptyTitle, { color: colors.text }]}>No Email Accounts</Text>
				<Text style={[styles.emptyText, { color: colors.text + '80' }]}>
					Add an email account to get started
				</Text>
				<TouchableOpacity
					style={[styles.addButton, { backgroundColor: colors.primary }]}
					onPress={() => router.push('/accounts')}
				>
					<Text style={styles.addButtonText}>Add Account</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<FlatList
				data={emails}
				renderItem={renderEmail}
				keyExtractor={(item) => item.id}
				refreshControl={
					<RefreshControl
						refreshing={syncing}
						onRefresh={handleRefresh}
						tintColor={colors.primary}
					/>
				}
				onEndReached={handleLoadMore}
				onEndReachedThreshold={0.5}
				ListEmptyComponent={
					loading ? (
						<View style={styles.listLoader}>
							<ActivityIndicator size="large" color={colors.primary} />
						</View>
					) : (
						<View style={styles.emptyList}>
							<Ionicons name="mail-open-outline" size={48} color={colors.text + '40'} />
							<Text style={[styles.emptyListText, { color: colors.text + '80' }]}>
								No emails yet
							</Text>
						</View>
					)
				}
				ListFooterComponent={
					loading && emails.length > 0 ? (
						<View style={styles.footer}>
							<ActivityIndicator size="small" color={colors.primary} />
						</View>
					) : null
				}
			/>

			{/* FAB for compose */}
			<TouchableOpacity
				style={[styles.fab, { backgroundColor: colors.primary }]}
				onPress={() => router.push('/compose')}
			>
				<Ionicons name="create" size={24} color="#fff" />
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	centerContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 24,
	},
	loadingText: {
		marginTop: 12,
		fontSize: 16,
	},
	emptyTitle: {
		fontSize: 20,
		fontWeight: '600',
		marginTop: 16,
	},
	emptyText: {
		fontSize: 15,
		marginTop: 8,
		textAlign: 'center',
	},
	addButton: {
		marginTop: 24,
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 8,
	},
	addButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600',
	},
	emailItem: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: 'rgba(128, 128, 128, 0.2)',
	},
	emailLeft: {
		marginRight: 12,
	},
	avatar: {
		width: 44,
		height: 44,
		borderRadius: 22,
		justifyContent: 'center',
		alignItems: 'center',
	},
	avatarText: {
		fontSize: 18,
		fontWeight: '600',
	},
	emailContent: {
		flex: 1,
	},
	emailHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 2,
	},
	fromName: {
		fontSize: 15,
		flex: 1,
		marginRight: 8,
	},
	date: {
		fontSize: 12,
	},
	subject: {
		fontSize: 14,
		marginBottom: 2,
	},
	snippet: {
		fontSize: 13,
	},
	unread: {
		fontWeight: '600',
	},
	starButton: {
		padding: 8,
	},
	listLoader: {
		paddingVertical: 40,
	},
	emptyList: {
		alignItems: 'center',
		paddingVertical: 60,
	},
	emptyListText: {
		marginTop: 12,
		fontSize: 15,
	},
	footer: {
		paddingVertical: 16,
	},
	fab: {
		position: 'absolute',
		right: 16,
		bottom: 16,
		width: 56,
		height: 56,
		borderRadius: 28,
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 4,
		elevation: 5,
	},
});
