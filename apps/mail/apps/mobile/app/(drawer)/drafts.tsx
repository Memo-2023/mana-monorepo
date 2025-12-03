import React, { useEffect } from 'react';
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
	Alert,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '~/context/AuthProvider';
import { useComposeStore } from '~/store/composeStore';
import { useEmailsStore } from '~/store/emailsStore';

export default function DraftsScreen() {
	const { colors } = useTheme();
	const router = useRouter();
	const { getToken } = useAuth();
	const { selectedAccountId } = useEmailsStore();
	const { drafts, loading, fetchDrafts, openDraft, deleteDraft } = useComposeStore();

	useEffect(() => {
		const loadDrafts = async () => {
			const token = await getToken();
			if (token) {
				await fetchDrafts(selectedAccountId || undefined, token);
			}
		};
		loadDrafts();
	}, [selectedAccountId]);

	const handleOpenDraft = (draft: any) => {
		openDraft(draft);
		router.push('/compose');
	};

	const handleDeleteDraft = async (draftId: string) => {
		Alert.alert('Delete Draft', 'Are you sure you want to delete this draft?', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Delete',
				style: 'destructive',
				onPress: async () => {
					const token = await getToken();
					if (token) {
						await deleteDraft(draftId, token);
					}
				},
			},
		]);
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString([], {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const renderDraft = ({ item }: { item: any }) => (
		<TouchableOpacity
			style={[styles.draftItem, { backgroundColor: colors.card }]}
			onPress={() => handleOpenDraft(item)}
			onLongPress={() => handleDeleteDraft(item.id)}
		>
			<View style={styles.draftContent}>
				<View style={styles.draftHeader}>
					<Text style={[styles.toAddress, { color: colors.text }]} numberOfLines={1}>
						{item.toAddresses?.length > 0
							? `To: ${item.toAddresses[0].name || item.toAddresses[0].email}`
							: 'Draft'}
					</Text>
					<Text style={[styles.date, { color: colors.text + '80' }]}>
						{formatDate(item.updatedAt)}
					</Text>
				</View>
				<Text style={[styles.subject, { color: colors.text }]} numberOfLines={1}>
					{item.subject || '(No Subject)'}
				</Text>
			</View>
			<TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteDraft(item.id)}>
				<Ionicons name="trash-outline" size={20} color="#ef4444" />
			</TouchableOpacity>
		</TouchableOpacity>
	);

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<FlatList
				data={drafts}
				renderItem={renderDraft}
				keyExtractor={(item) => item.id}
				ListEmptyComponent={
					loading ? (
						<View style={styles.centerContainer}>
							<ActivityIndicator size="large" color={colors.primary} />
						</View>
					) : (
						<View style={styles.emptyList}>
							<Ionicons name="document-text-outline" size={48} color={colors.text + '40'} />
							<Text style={[styles.emptyListText, { color: colors.text + '80' }]}>No drafts</Text>
						</View>
					)
				}
			/>

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
		paddingVertical: 40,
	},
	draftItem: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: 'rgba(128, 128, 128, 0.2)',
	},
	draftContent: {
		flex: 1,
	},
	draftHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 4,
	},
	toAddress: {
		fontSize: 15,
		fontWeight: '500',
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
