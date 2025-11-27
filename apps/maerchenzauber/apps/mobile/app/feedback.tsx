import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	Dimensions,
	RefreshControl,
	ActivityIndicator,
	TextInput,
	Alert,
	Animated,
	Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import CommonHeader from '../components/molecules/CommonHeader';
import Button from '../components/atoms/Button';
import { Feather } from '@expo/vector-icons';
import { fetchWithAuth } from '../src/utils/api';
import { useAuth } from '../src/contexts/AuthContext';
import { usePostHog } from '../src/hooks/usePostHog';
import { ParentalGate } from '../src/components/ParentalGate';
import { useParentalGate } from '../src/hooks/useParentalGate';

interface FeedbackItem {
	id: string;
	title: string;
	feedbackText: string;
	category: string;
	status: string;
	voteCount: number;
	userHasVoted: boolean;
	adminResponse?: string;
	createdAt: string;
	completedAt?: string;
}

const STATUS_LABELS: Record<string, string> = {
	submitted: 'Eingereicht',
	under_review: 'Wird geprüft',
	planned: 'Geplant',
	in_progress: 'In Arbeit',
	completed: 'Umgesetzt',
	declined: 'Abgelehnt',
};

const STATUS_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
	submitted: 'clock',
	under_review: 'eye',
	planned: 'calendar',
	in_progress: 'loader',
	completed: 'check-circle',
	declined: 'x-circle',
};

const STATUS_COLORS: Record<string, string> = {
	submitted: '#999',
	under_review: '#3498DB',
	planned: '#9B59B6',
	in_progress: '#F39C12',
	completed: '#27AE60',
	declined: '#E74C3C',
};

export default function Feedback() {
	const { user } = useAuth();
	const posthog = usePostHog();
	const { isVisible, config, setIsVisible, requestParentalPermission } = useParentalGate();
	const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
	const [myFeedback, setMyFeedback] = useState<FeedbackItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [feedbackText, setFeedbackText] = useState('');
	const [isSavingFeedback, setIsSavingFeedback] = useState(false);
	const [showSuccessMessage, setShowSuccessMessage] = useState(false);
	const [successOpacity] = useState(new Animated.Value(0));
	const [myFeedbackExpanded, setMyFeedbackExpanded] = useState(false);
	const [parentalGateApproved, setParentalGateApproved] = useState(false);
	const { width: screenWidth } = Dimensions.get('window');
	const isWideScreen = screenWidth > 1000;

	const loadFeedback = async () => {
		try {
			// Load public feedback
			const publicResponse = await fetchWithAuth('/feedback/public?sort=votes');
			if (publicResponse.ok) {
				const publicData = await publicResponse.json();
				setFeedbackItems(publicData);
			}

			// Load user's feedback
			const myResponse = await fetchWithAuth('/feedback/my');
			if (myResponse.ok) {
				const myData = await myResponse.json();
				setMyFeedback(myData);
			}
		} catch (error) {
			console.error('Error loading feedback:', error);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	useEffect(() => {
		loadFeedback();
	}, []);

	const handleRefresh = () => {
		setRefreshing(true);
		loadFeedback();
	};

	const handleVote = async (feedbackId: string, hasVoted: boolean) => {
		try {
			const endpoint = `/feedback/${feedbackId}/vote`;
			const method = hasVoted ? 'DELETE' : 'POST';

			console.log('[Feedback] Voting:', { feedbackId, hasVoted, method, endpoint });

			const response = await fetchWithAuth(endpoint, { method });

			if (response.ok) {
				const data = await response.json();
				console.log('[Feedback] Vote response:', data);

				const { newVoteCount } = data;

				if (typeof newVoteCount === 'number') {
					console.log('[Feedback] Updating vote count to:', newVoteCount);

					// Update the vote count and status in the "All" list
					setFeedbackItems((prev) =>
						prev.map((item) =>
							item.id === feedbackId
								? { ...item, voteCount: newVoteCount, userHasVoted: !hasVoted }
								: item
						)
					);

					// Also update in "My" list if the item exists there
					setMyFeedback((prev) =>
						prev.map((item) =>
							item.id === feedbackId
								? { ...item, voteCount: newVoteCount, userHasVoted: !hasVoted }
								: item
						)
					);
				} else {
					console.error('[Feedback] Invalid newVoteCount:', newVoteCount);
				}
			} else {
				console.error('[Feedback] Vote request failed:', response.status, response.statusText);
				const errorText = await response.text();
				console.error('[Feedback] Error response:', errorText);
			}
		} catch (error) {
			console.error('[Feedback] Error voting:', error);
		}
	};

	const handleFeedbackSubmit = async () => {
		if (!feedbackText.trim()) {
			Alert.alert('Fehler', 'Bitte gib dein Feedback ein.');
			return;
		}

		// Check for parental approval first (Kids Category requirement)
		if (!parentalGateApproved) {
			const granted = await requestParentalPermission({
				title: 'Feedback senden',
				message: 'Um Feedback an den Entwickler zu senden, löse bitte diese Rechenaufgabe:',
			});

			if (!granted) {
				return; // User cancelled
			}

			setParentalGateApproved(true);
		}

		try {
			setIsSavingFeedback(true);

			if (!user) {
				Alert.alert('Error', 'Du musst angemeldet sein, um Feedback zu senden');
				return;
			}

			const response = await fetchWithAuth('/feedback', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					feedbackText: feedbackText.trim(),
					category: 'feature',
				}),
			});

			if (!response.ok) {
				throw new Error('Failed to submit feedback');
			}

			posthog?.capture('feedback_submitted', {
				category: 'feature',
				source: 'feedback_page',
			});

			setFeedbackText('');
			setShowSuccessMessage(true);

			// Animate success message
			Animated.sequence([
				Animated.timing(successOpacity, {
					toValue: 1,
					duration: 300,
					useNativeDriver: true,
				}),
				Animated.delay(3000),
				Animated.timing(successOpacity, {
					toValue: 0,
					duration: 300,
					useNativeDriver: true,
				}),
			]).start(() => setShowSuccessMessage(false));

			// Reload feedback to show the new submission
			await loadFeedback();
			setMyFeedbackExpanded(true);
		} catch (error) {
			console.error('Error saving feedback:', error);
			Alert.alert('Fehler', 'Feedback konnte nicht gespeichert werden.');
		} finally {
			setIsSavingFeedback(false);
		}
	};

	const renderFeedbackCard = (item: FeedbackItem, showStatus: boolean = true) => {
		const statusColor = STATUS_COLORS[item.status] || '#999';
		const statusIcon = STATUS_ICONS[item.status] || 'circle';
		const statusLabel = STATUS_LABELS[item.status] || item.status;

		return (
			<View key={item.id} style={styles.feedbackCard}>
				<View style={styles.cardHeader}>
					<View style={styles.voteSection}>
						<TouchableOpacity
							style={[styles.voteButton, item.userHasVoted && styles.voteButtonActive]}
							onPress={() => handleVote(item.id, item.userHasVoted)}
							activeOpacity={0.7}
						>
							<Feather name="chevron-up" size={20} color={item.userHasVoted ? '#FFD700' : '#999'} />
							<Text style={[styles.voteCount, item.userHasVoted && styles.voteCountActive]}>
								{item.voteCount}
							</Text>
						</TouchableOpacity>
					</View>

					<View style={styles.cardContent}>
						<Text style={styles.feedbackTitle}>
							{item.title ||
								item.feedbackText.substring(0, 50) + (item.feedbackText.length > 50 ? '...' : '')}
						</Text>

						{showStatus && (
							<View style={styles.statusContainer}>
								<Feather name={statusIcon} size={14} color={statusColor} />
								<Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
							</View>
						)}

						{item.adminResponse && (
							<View style={styles.adminResponse}>
								<Feather name="message-circle" size={14} color="#4A90E2" style={styles.adminIcon} />
								<Text style={styles.adminResponseText}>{item.adminResponse}</Text>
							</View>
						)}
					</View>
				</View>
			</View>
		);
	};

	const groupedByStatus = feedbackItems.reduce(
		(acc, item) => {
			if (!acc[item.status]) {
				acc[item.status] = [];
			}
			acc[item.status].push(item);
			return acc;
		},
		{} as Record<string, FeedbackItem[]>
	);

	const statusOrder = [
		'completed',
		'in_progress',
		'planned',
		'under_review',
		'submitted',
		'declined',
	];

	const dynamicStyles = {
		scrollContainer: {
			maxWidth: 600,
			width: '100%',
			alignSelf: 'center' as const,
			paddingHorizontal: isWideScreen ? 0 : 20,
		},
	};

	if (loading) {
		return (
			<SafeAreaView style={styles.safeArea} edges={['top']}>
				<CommonHeader title="Feedback & Wünsche" showBackButton onBack={() => router.back()} />
				<View style={[styles.container, styles.centerContent]}>
					<ActivityIndicator size="large" color="#FFD700" />
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<CommonHeader title="Feedback & Wünsche" showBackButton onBack={() => router.back()} />
			<ParentalGate
				visible={isVisible}
				onSuccess={config.onSuccess || (() => {})}
				onCancel={() => setIsVisible(false)}
				title={config.title}
				message={config.message}
			/>
			<ScrollView
				style={styles.container}
				contentContainerStyle={[styles.scrollContent, dynamicStyles.scrollContainer]}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#FFD700" />
				}
			>
				{/* Feedback Form - Immer oben */}
				<View style={styles.section}>
					<View style={styles.sectionHeader}>
						<Feather name="edit-3" size={20} color="#FFD700" style={styles.sectionIcon} />
						<Text style={styles.sectionTitle}>Feedback geben</Text>
					</View>
					<Text style={styles.description}>
						Teile uns deine Ideen, Wünsche und Verbesserungsvorschläge mit! Wir freuen uns über
						jedes Feedback.
					</Text>

					<TextInput
						style={styles.feedbackInput}
						placeholder="Was hat dir gefallen? Was können wir verbessern?"
						placeholderTextColor="rgba(255, 255, 255, 0.5)"
						multiline
						value={feedbackText}
						onChangeText={setFeedbackText}
						numberOfLines={8}
					/>

					<Button
						title={isSavingFeedback ? 'Wird gesendet...' : 'Feedback senden'}
						onPress={handleFeedbackSubmit}
						variant="primary"
						size="lg"
						iconName="chevron.right"
						iconSet="sf-symbols"
						iconPosition="right"
						disabled={isSavingFeedback || !feedbackText.trim()}
						style={styles.submitButton}
					/>

					{showSuccessMessage && (
						<Animated.View style={[styles.successMessage, { opacity: successOpacity }]}>
							<Feather name="check-circle" size={20} color="#27AE60" />
							<Text style={styles.successText}>
								Vielen Dank für dein Feedback! Es wird von unserem Team geprüft.
							</Text>
						</Animated.View>
					)}
				</View>

				{/* Dein Feedback - Nur wenn vorhanden */}
				{myFeedback.length > 0 && (
					<View style={styles.section}>
						<TouchableOpacity
							style={styles.collapsibleHeader}
							onPress={() => setMyFeedbackExpanded(!myFeedbackExpanded)}
							activeOpacity={0.7}
						>
							<View style={styles.sectionHeader}>
								<Feather name="user" size={20} color="#4A90E2" style={styles.sectionIcon} />
								<Text style={styles.sectionTitle}>Dein Feedback ({myFeedback.length})</Text>
							</View>
							<Feather
								name={myFeedbackExpanded ? 'chevron-up' : 'chevron-down'}
								size={20}
								color="#999"
							/>
						</TouchableOpacity>

						{myFeedbackExpanded && (
							<View style={styles.collapsibleContent}>
								<Text style={styles.description}>
									Hier siehst du dein eingereichtes Feedback. Freigegebenes Feedback erscheint in
									der Community-Liste unten.
								</Text>
								{myFeedback.map((item) => renderFeedbackCard(item))}
							</View>
						)}
					</View>
				)}

				{/* Community Feedback - Status-Gruppen */}
				<View style={styles.section}>
					<View style={styles.sectionHeader}>
						<Feather name="users" size={20} color="#9B59B6" style={styles.sectionIcon} />
						<Text style={styles.sectionTitle}>Community Wünsche</Text>
					</View>
					<Text style={styles.description}>
						Stimme für Features ab, die du dir wünschst! Die beliebtesten werden zuerst umgesetzt.
					</Text>

					{statusOrder.map((status) => {
						const items = groupedByStatus[status] || [];
						if (items.length === 0) return null;

						return (
							<View key={status} style={styles.statusSection}>
								<View style={styles.statusHeader}>
									<Feather
										name={STATUS_ICONS[status]}
										size={20}
										color={STATUS_COLORS[status]}
										style={styles.statusHeaderIcon}
									/>
									<Text style={styles.statusSectionTitle}>
										{STATUS_LABELS[status]} ({items.length})
									</Text>
								</View>
								{items.map((item) => renderFeedbackCard(item, false))}
							</View>
						);
					})}

					{feedbackItems.length === 0 && (
						<View style={styles.emptyState}>
							<Feather name="inbox" size={64} color="#333" />
							<Text style={styles.emptyText}>Noch keine Features geplant</Text>
						</View>
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#181818',
	},
	container: {
		flex: 1,
	},
	centerContent: {
		justifyContent: 'center',
		alignItems: 'center',
	},
	scrollContent: {
		flexGrow: 1,
		paddingTop: 100,
		paddingBottom: Platform.OS === 'android' ? 300 : 40,
	},
	section: {
		marginBottom: 32,
	},
	sectionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
	},
	sectionIcon: {
		marginRight: 12,
	},
	sectionTitle: {
		fontSize: 22,
		fontWeight: '700',
		color: '#FFFFFF',
	},
	collapsibleHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 8,
	},
	collapsibleContent: {
		marginTop: 8,
	},
	description: {
		fontSize: 15,
		color: '#999',
		marginBottom: 20,
		lineHeight: 22,
	},
	statusSection: {
		marginBottom: 24,
		marginTop: 16,
	},
	statusHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 12,
	},
	statusHeaderIcon: {
		marginRight: 8,
	},
	statusSectionTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#FFFFFF',
	},
	feedbackCard: {
		backgroundColor: '#222',
		borderRadius: 12,
		padding: 16,
		marginBottom: 12,
	},
	cardHeader: {
		flexDirection: 'row',
	},
	voteSection: {
		marginRight: 16,
		alignItems: 'center',
	},
	voteButton: {
		alignItems: 'center',
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 8,
		backgroundColor: '#2A2A2A',
		minWidth: 50,
	},
	voteButtonActive: {
		backgroundColor: 'rgba(255, 215, 0, 0.1)',
	},
	voteCount: {
		fontSize: 16,
		fontWeight: '600',
		color: '#999',
		marginTop: 4,
	},
	voteCountActive: {
		color: '#FFD700',
	},
	cardContent: {
		flex: 1,
	},
	feedbackTitle: {
		fontSize: 16,
		fontWeight: '500',
		color: '#FFFFFF',
		marginBottom: 8,
		lineHeight: 22,
	},
	statusContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 8,
	},
	statusText: {
		fontSize: 14,
		fontWeight: '500',
		marginLeft: 6,
	},
	adminResponse: {
		flexDirection: 'row',
		marginTop: 12,
		padding: 12,
		backgroundColor: 'rgba(74, 144, 226, 0.1)',
		borderRadius: 8,
		borderLeftWidth: 3,
		borderLeftColor: '#4A90E2',
	},
	adminIcon: {
		marginRight: 8,
		marginTop: 2,
	},
	adminResponseText: {
		flex: 1,
		fontSize: 14,
		color: '#CCCCCC',
		lineHeight: 20,
	},
	emptyState: {
		alignItems: 'center',
		paddingVertical: 60,
	},
	emptyText: {
		fontSize: 18,
		color: '#666',
		marginTop: 16,
		fontWeight: '500',
	},
	feedbackInput: {
		backgroundColor: '#222',
		borderRadius: 12,
		padding: 16,
		color: '#FFFFFF',
		minHeight: 160,
		textAlignVertical: 'top',
		width: '100%',
		fontSize: 16,
		lineHeight: 24,
		borderWidth: 1,
		borderColor: '#333',
		marginBottom: 20,
	},
	submitButton: {
		width: '100%',
	},
	successMessage: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(39, 174, 96, 0.1)',
		padding: 16,
		borderRadius: 12,
		marginTop: 20,
		borderLeftWidth: 3,
		borderLeftColor: '#27AE60',
	},
	successText: {
		flex: 1,
		fontSize: 15,
		color: '#27AE60',
		marginLeft: 12,
		lineHeight: 22,
	},
});
