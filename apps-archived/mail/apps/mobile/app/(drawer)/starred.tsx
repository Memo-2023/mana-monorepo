import React, { useEffect, useCallback, useState } from 'react';
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
import { emailsApi } from '~/utils/api';

export default function StarredScreen() {
	const { colors } = useTheme();
	const router = useRouter();
	const { getToken } = useAuth();
	const [emails, setEmails] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	const fetchStarredEmails = async () => {
		const token = await getToken();
		if (!token) return;

		const result = await emailsApi.list({ limit: 100 }, token);
		if (result.data?.emails) {
			// Filter starred emails client-side
			setEmails(result.data.emails.filter((e: any) => e.isStarred));
		}
		setLoading(false);
		setRefreshing(false);
	};

	useEffect(() => {
		fetchStarredEmails();
	}, []);

	const handleRefresh = useCallback(() => {
		setRefreshing(true);
		fetchStarredEmails();
	}, []);

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
			<View style={styles.emailLeft}>
				<View style={[styles.avatar, { backgroundColor: colors.primary + '30' }]}>
					<Text style={[styles.avatarText, { color: colors.primary }]}>
						{(item.fromName || item.fromAddress)?.charAt(0).toUpperCase()}
					</Text>
				</View>
			</View>

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
				<Text style={[styles.snippet, { color: colors.text + '80' }]} numberOfLines={1}>
					{item.snippet || ''}
				</Text>
			</View>

			<Ionicons name="star" size={20} color="#f59e0b" />
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
						refreshing={refreshing}
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
							<Ionicons name="star-outline" size={48} color={colors.text + '40'} />
							<Text style={[styles.emptyListText, { color: colors.text + '80' }]}>
								No starred emails
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
	emptyList: {
		alignItems: 'center',
		paddingVertical: 60,
	},
	emptyListText: {
		marginTop: 12,
		fontSize: 15,
	},
});
