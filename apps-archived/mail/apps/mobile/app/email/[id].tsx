import React, { useEffect, useState } from 'react';
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
	Alert,
	useWindowDimensions,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { useAuth } from '~/context/AuthProvider';
import { useEmailsStore } from '~/store/emailsStore';
import { useComposeStore } from '~/store/composeStore';

export default function EmailDetailScreen() {
	const { colors } = useTheme();
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const { width } = useWindowDimensions();
	const { getToken } = useAuth();
	const { selectedEmail, loading, fetchEmail, toggleStar, deleteEmail, moveEmail, folders } =
		useEmailsStore();
	const { createReply, createReplyAll, createForward } = useComposeStore();

	const [webViewHeight, setWebViewHeight] = useState(300);

	useEffect(() => {
		const loadEmail = async () => {
			if (!id) return;
			const token = await getToken();
			if (token) {
				await fetchEmail(id, token);
			}
		};
		loadEmail();
	}, [id]);

	const handleStar = async () => {
		if (!id) return;
		const token = await getToken();
		if (token) {
			await toggleStar(id, token);
		}
	};

	const handleDelete = async () => {
		Alert.alert('Delete Email', 'Move this email to trash?', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Delete',
				style: 'destructive',
				onPress: async () => {
					const token = await getToken();
					if (token && id) {
						await deleteEmail(id, token);
						router.back();
					}
				},
			},
		]);
	};

	const handleReply = async () => {
		if (!id) return;
		const token = await getToken();
		if (token) {
			await createReply(id, token);
			router.push('/compose');
		}
	};

	const handleReplyAll = async () => {
		if (!id) return;
		const token = await getToken();
		if (token) {
			await createReplyAll(id, token);
			router.push('/compose');
		}
	};

	const handleForward = async () => {
		if (!id) return;
		const token = await getToken();
		if (token) {
			await createForward(id, token);
			router.push('/compose');
		}
	};

	const handleMoveToFolder = () => {
		const customFolders = folders.filter((f) => f.type !== 'inbox' && f.type !== 'trash');
		const options = customFolders.map((f) => ({
			text: f.name,
			onPress: async () => {
				const token = await getToken();
				if (token && id) {
					await moveEmail(id, f.id, token);
					router.back();
				}
			},
		}));

		Alert.alert('Move to Folder', 'Select a folder', [
			{ text: 'Cancel', style: 'cancel' },
			...options,
		]);
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleString([], {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const htmlContent = `
		<!DOCTYPE html>
		<html>
		<head>
			<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
			<style>
				body {
					font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
					font-size: 16px;
					line-height: 1.5;
					color: ${colors.text};
					margin: 0;
					padding: 16px;
					background-color: transparent;
				}
				img { max-width: 100%; height: auto; }
				a { color: ${colors.primary}; }
				pre { overflow-x: auto; white-space: pre-wrap; }
			</style>
		</head>
		<body>
			${selectedEmail?.bodyHtml || selectedEmail?.bodyPlain?.replace(/\n/g, '<br>') || ''}
		</body>
		</html>
	`;

	if (loading && !selectedEmail) {
		return (
			<View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
				<ActivityIndicator size="large" color={colors.primary} />
			</View>
		);
	}

	if (!selectedEmail) {
		return (
			<View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
				<Text style={{ color: colors.text }}>Email not found</Text>
			</View>
		);
	}

	return (
		<View style={[styles.container, { backgroundColor: colors.background }]}>
			<Stack.Screen
				options={{
					headerShown: true,
					headerTitle: '',
					headerStyle: { backgroundColor: colors.card },
					headerTintColor: colors.text,
					headerRight: () => (
						<View style={styles.headerActions}>
							<TouchableOpacity style={styles.headerButton} onPress={handleStar}>
								<Ionicons
									name={selectedEmail.isStarred ? 'star' : 'star-outline'}
									size={24}
									color={selectedEmail.isStarred ? '#f59e0b' : colors.text}
								/>
							</TouchableOpacity>
							<TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
								<Ionicons name="trash-outline" size={24} color={colors.text} />
							</TouchableOpacity>
						</View>
					),
				}}
			/>

			<ScrollView style={styles.content}>
				{/* Subject */}
				<Text style={[styles.subject, { color: colors.text }]}>
					{selectedEmail.subject || '(No Subject)'}
				</Text>

				{/* From info */}
				<View style={styles.senderSection}>
					<View style={[styles.avatar, { backgroundColor: colors.primary + '30' }]}>
						<Text style={[styles.avatarText, { color: colors.primary }]}>
							{(selectedEmail.fromName || selectedEmail.fromAddress)?.charAt(0).toUpperCase()}
						</Text>
					</View>
					<View style={styles.senderInfo}>
						<Text style={[styles.senderName, { color: colors.text }]}>
							{selectedEmail.fromName || selectedEmail.fromAddress}
						</Text>
						<Text style={[styles.senderEmail, { color: colors.text + '80' }]}>
							{selectedEmail.fromAddress}
						</Text>
						<Text style={[styles.date, { color: colors.text + '60' }]}>
							{formatDate(selectedEmail.receivedAt || selectedEmail.sentAt)}
						</Text>
					</View>
				</View>

				{/* Recipients */}
				<View style={styles.recipientsSection}>
					<Text style={[styles.recipientLabel, { color: colors.text + '80' }]}>To: </Text>
					<Text style={[styles.recipientValue, { color: colors.text }]}>
						{selectedEmail.toAddresses?.map((a) => a.name || a.email).join(', ')}
					</Text>
				</View>

				{/* AI Summary */}
				{selectedEmail.aiSummary && (
					<View style={[styles.summarySection, { backgroundColor: colors.primary + '10' }]}>
						<View style={styles.summaryHeader}>
							<Ionicons name="sparkles" size={16} color={colors.primary} />
							<Text style={[styles.summaryTitle, { color: colors.primary }]}>AI Summary</Text>
						</View>
						<Text style={[styles.summaryText, { color: colors.text }]}>
							{selectedEmail.aiSummary}
						</Text>
					</View>
				)}

				{/* Body */}
				<View style={[styles.bodySection, { minHeight: webViewHeight }]}>
					<WebView
						originWhitelist={['*']}
						source={{ html: htmlContent }}
						style={{ backgroundColor: 'transparent', width: width - 32 }}
						scrollEnabled={false}
						onMessage={(event) => {
							const height = parseInt(event.nativeEvent.data, 10);
							if (height > 0) {
								setWebViewHeight(height + 50);
							}
						}}
						injectedJavaScript={`
							window.ReactNativeWebView.postMessage(document.body.scrollHeight.toString());
							true;
						`}
					/>
				</View>
			</ScrollView>

			{/* Action bar */}
			<View
				style={[styles.actionBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}
			>
				<TouchableOpacity style={styles.actionButton} onPress={handleReply}>
					<Ionicons name="arrow-undo" size={22} color={colors.text} />
					<Text style={[styles.actionText, { color: colors.text }]}>Reply</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.actionButton} onPress={handleReplyAll}>
					<Ionicons name="arrow-undo-circle" size={22} color={colors.text} />
					<Text style={[styles.actionText, { color: colors.text }]}>Reply All</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.actionButton} onPress={handleForward}>
					<Ionicons name="arrow-redo" size={22} color={colors.text} />
					<Text style={[styles.actionText, { color: colors.text }]}>Forward</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.actionButton} onPress={handleMoveToFolder}>
					<Ionicons name="folder" size={22} color={colors.text} />
					<Text style={[styles.actionText, { color: colors.text }]}>Move</Text>
				</TouchableOpacity>
			</View>
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
	},
	content: {
		flex: 1,
	},
	headerActions: {
		flexDirection: 'row',
	},
	headerButton: {
		padding: 8,
		marginLeft: 8,
	},
	subject: {
		fontSize: 22,
		fontWeight: '600',
		padding: 16,
		paddingBottom: 8,
	},
	senderSection: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
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
	senderInfo: {
		marginLeft: 12,
		flex: 1,
	},
	senderName: {
		fontSize: 16,
		fontWeight: '600',
	},
	senderEmail: {
		fontSize: 14,
	},
	date: {
		fontSize: 12,
		marginTop: 2,
	},
	recipientsSection: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		paddingBottom: 12,
	},
	recipientLabel: {
		fontSize: 14,
	},
	recipientValue: {
		fontSize: 14,
		flex: 1,
	},
	summarySection: {
		margin: 16,
		padding: 12,
		borderRadius: 8,
	},
	summaryHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 6,
	},
	summaryTitle: {
		fontSize: 14,
		fontWeight: '600',
		marginLeft: 6,
	},
	summaryText: {
		fontSize: 14,
		lineHeight: 20,
	},
	bodySection: {
		paddingHorizontal: 16,
	},
	actionBar: {
		flexDirection: 'row',
		justifyContent: 'space-around',
		paddingVertical: 12,
		borderTopWidth: 1,
	},
	actionButton: {
		alignItems: 'center',
	},
	actionText: {
		fontSize: 11,
		marginTop: 4,
	},
});
