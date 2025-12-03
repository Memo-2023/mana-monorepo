import React, { useEffect, useCallback } from 'react';
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
	RefreshControl,
	Alert,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '~/context/AuthProvider';
import { useEmailsStore } from '~/store/emailsStore';

export default function TrashScreen() {
	const { colors } = useTheme();
	const router = useRouter();
	const { getToken } = useAuth();
	const {
		folders,
		emails,
		loading,
		syncing,
		selectFolder,
		fetchEmails,
		deleteEmail,
		selectedAccountId,
		syncAccount,
	} = useEmailsStore();

	useEffect(() => {
		const loadTrash = async () => {
			const trashFolder = folders.find((f) => f.type === 'trash');
			if (trashFolder) {
				selectFolder(trashFolder.id);
				const token = await getToken();
				if (token) {
					await fetchEmails(token, true);
				}
			}
		};
		loadTrash();
	}, [folders]);

	const handleRefresh = useCallback(async () => {
		if (!selectedAccountId) return;
		const token = await getToken();
		if (token) {
			await syncAccount(selectedAccountId, token);
		}
	}, [selectedAccountId]);

	const handlePermanentDelete = async (emailId: string) => {
		Alert.alert(
			'Permanently Delete',
			'This email will be permanently deleted. This action cannot be undone.',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						const token = await getToken();
						if (token) {
							await deleteEmail(emailId, token);
						}
					},
				},
			]
		);
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
	};

	const renderEmail = ({ item }: { item: any }) => (
		<TouchableOpacity
			style={[styles.emailItem, { backgroundColor: colors.card }]}
			onPress={() => router.push(`/email/${item.id}`)}
			onLongPress={() => handlePermanentDelete(item.id)}
		>
			<View style={styles.emailContent}>
				<View style={styles.emailHeader}>
					<Text style={[styles.fromName, { color: colors.text }]} numberOfLines={1}>
						{item.fromName || item.fromAddress}
					</Text>
					<Text style={[styles.date, { color: colors.text + '80' }]}>
						{formatDate(item.receivedAt || item.sentAt)}
					</Text>
				</View>
				<Text style={[styles.subject, { color: colors.text }]} numberOfLines={1}>
					{item.subject || '(No Subject)'}
				</Text>
			</View>
			<TouchableOpacity style={styles.deleteButton} onPress={() => handlePermanentDelete(item.id)}>
				<Ionicons name="close-circle" size={22} color="#ef4444" />
			</TouchableOpacity>
		</TouchableOpacity>
	);

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
				ListEmptyComponent={
					loading ? (
						<View style={styles.centerContainer}>
							<ActivityIndicator size="large" color={colors.primary} />
						</View>
					) : (
						<View style={styles.emptyList}>
							<Ionicons name="trash-outline" size={48} color={colors.text + '40'} />
							<Text style={[styles.emptyListText, { color: colors.text + '80' }]}>
								Trash is empty
							</Text>
						</View>
					)
				}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	centerContainer: {
		paddingVertical: 40,
	},
	emailItem: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: 'rgba(128, 128, 128, 0.2)',
	},
	emailContent: {
		flex: 1,
	},
	emailHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 4,
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
	},
	deleteButton: {
		padding: 8,
	},
	emptyList: {
		alignItems: 'center',
		paddingVertical: 60,
	},
	emptyListText: {
		marginTop: 12,
		fontSize: 15,
	},
});
