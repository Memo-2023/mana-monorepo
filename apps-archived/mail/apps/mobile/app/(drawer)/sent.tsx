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

export default function SentScreen() {
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
		syncAccount,
		selectedAccountId,
	} = useEmailsStore();

	useEffect(() => {
		const loadSent = async () => {
			const sentFolder = folders.find((f) => f.type === 'sent');
			if (sentFolder) {
				selectFolder(sentFolder.id);
				const token = await getToken();
				if (token) {
					await fetchEmails(token, true);
				}
			}
		};
		loadSent();
	}, [folders]);

	const handleRefresh = useCallback(async () => {
		if (!selectedAccountId) return;
		const token = await getToken();
		if (token) {
			await syncAccount(selectedAccountId, token);
		}
	}, [selectedAccountId]);

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
			style={[styles.emailItem, { backgroundColor: colors.card }]}
			onPress={() => router.push(`/email/${item.id}`)}
		>
			<View style={styles.emailContent}>
				<View style={styles.emailHeader}>
					<Text style={[styles.toName, { color: colors.text }]} numberOfLines={1}>
						To: {item.toAddresses?.[0]?.name || item.toAddresses?.[0]?.email || 'Unknown'}
					</Text>
					<Text style={[styles.date, { color: colors.text + '80' }]}>
						{formatDate(item.sentAt)}
					</Text>
				</View>
				<Text style={[styles.subject, { color: colors.text }]} numberOfLines={1}>
					{item.subject || '(No Subject)'}
				</Text>
				<Text style={[styles.snippet, { color: colors.text + '80' }]} numberOfLines={1}>
					{item.snippet || ''}
				</Text>
			</View>
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
							<Ionicons name="send-outline" size={48} color={colors.text + '40'} />
							<Text style={[styles.emptyListText, { color: colors.text + '80' }]}>
								No sent emails
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
		marginBottom: 2,
	},
	toName: {
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
	emptyList: {
		alignItems: 'center',
		paddingVertical: 60,
	},
	emptyListText: {
		marginTop: 12,
		fontSize: 15,
	},
});
