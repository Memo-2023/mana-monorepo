import React, { useState, useEffect } from 'react';
import {
	View,
	ScrollView,
	StyleSheet,
	TouchableOpacity,
	ActivityIndicator,
	Modal,
} from 'react-native';
import { Text } from '~/components/ui/Text';
import { useTheme } from '~/utils/theme/theme';
import { supabase } from '~/utils/supabase';
import {
	getCurrentTokenBalance,
	getTokenTransactions,
	getTokenUsageStats,
} from '~/services/tokenTransactionService';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import TokenStore from '~/components/monetization/TokenStore';

export default function TokenManagementScreen() {
	const { isDark } = useTheme();
	const [tokenBalance, setTokenBalance] = useState<number | null>(null);
	const [transactions, setTransactions] = useState<any[]>([]);
	const [usageStats, setUsageStats] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('month');
	const [storeVisible, setStoreVisible] = useState(false);

	useEffect(() => {
		const loadData = async () => {
			try {
				setLoading(true);

				// Hole den aktuellen Benutzer
				const { data: sessionData } = await supabase.auth.getSession();
				const userId = sessionData?.session?.user?.id;

				if (!userId) {
					throw new Error('Nicht angemeldet');
				}

				// Hole das Token-Guthaben
				const balance = await getCurrentTokenBalance(userId);
				setTokenBalance(balance);

				// Hole die Token-Transaktionen
				const transactionData = await getTokenTransactions(userId, 20);
				setTransactions(transactionData);

				// Hole die Nutzungsstatistiken
				const stats = await getTokenUsageStats(userId, timeframe);
				setUsageStats(stats);
			} catch (error) {
				console.error('Fehler beim Laden der Token-Daten:', error);
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, [timeframe, storeVisible]); // Aktualisieren, wenn der Store geschlossen wird

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	const getTransactionTypeLabel = (type: string) => {
		switch (type) {
			case 'usage':
				return 'Nutzung';
			case 'purchase':
				return 'Kauf';
			case 'monthly_reset':
				return 'Monatliches Kontingent';
			default:
				return type;
		}
	};

	const getTransactionColor = (type: string, amount: number) => {
		if (amount > 0) {
			return isDark ? '#10b981' : '#059669'; // Grün für positive Beträge
		} else {
			return isDark ? '#ef4444' : '#dc2626'; // Rot für negative Beträge
		}
	};

	const handleTimeframeChange = (newTimeframe: 'day' | 'week' | 'month' | 'year') => {
		setTimeframe(newTimeframe);
	};

	return (
		<View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
			<Stack.Screen
				options={{
					title: 'Token-Verwaltung',
					headerStyle: {
						backgroundColor: isDark ? '#1f2937' : '#ffffff',
					},
					headerTintColor: isDark ? '#f9fafb' : '#1f2937',
				}}
			/>

			<ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
				{loading ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size="large" color={isDark ? '#f9fafb' : '#1f2937'} />
						<Text style={[styles.loadingText, { color: isDark ? '#f9fafb' : '#000000' }]}>
							Lade Token-Daten...
						</Text>
					</View>
				) : (
					<>
						{/* Token-Guthaben */}
						<View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
							<Text style={[styles.cardTitle, { color: isDark ? '#f9fafb' : '#000000' }]}>
								Aktuelles Token-Guthaben
							</Text>
							<Text style={[styles.balanceText, { color: isDark ? '#f9fafb' : '#000000' }]}>
								{tokenBalance !== null ? tokenBalance.toLocaleString() : '---'}
							</Text>
							<TouchableOpacity
								style={[styles.button, isDark ? styles.buttonDark : styles.buttonLight]}
								onPress={() => setStoreVisible(true)}
							>
								<Text style={[styles.buttonText, { color: isDark ? '#ffffff' : '#ffffff' }]}>
									Tokens kaufen
								</Text>
							</TouchableOpacity>
						</View>

						{/* Nutzungsstatistiken */}
						<View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
							<Text style={[styles.cardTitle, { color: isDark ? '#f9fafb' : '#000000' }]}>
								Token-Nutzung
							</Text>

							<View style={styles.timeframeSelector}>
								<TouchableOpacity
									style={[
										styles.timeframeButton,
										timeframe === 'day' && styles.timeframeButtonActive,
										isDark ? styles.timeframeButtonDark : styles.timeframeButtonLight,
										timeframe === 'day' &&
											(isDark
												? styles.timeframeButtonActiveDark
												: styles.timeframeButtonActiveLight),
									]}
									onPress={() => handleTimeframeChange('day')}
								>
									<Text
										style={[
											styles.timeframeButtonText,
											{ color: isDark ? '#f9fafb' : '#000000' },
											timeframe === 'day' && styles.timeframeButtonTextActive,
										]}
									>
										Tag
									</Text>
								</TouchableOpacity>

								<TouchableOpacity
									style={[
										styles.timeframeButton,
										timeframe === 'week' && styles.timeframeButtonActive,
										isDark ? styles.timeframeButtonDark : styles.timeframeButtonLight,
										timeframe === 'week' &&
											(isDark
												? styles.timeframeButtonActiveDark
												: styles.timeframeButtonActiveLight),
									]}
									onPress={() => handleTimeframeChange('week')}
								>
									<Text
										style={[
											styles.timeframeButtonText,
											{ color: isDark ? '#f9fafb' : '#000000' },
											timeframe === 'week' && styles.timeframeButtonTextActive,
										]}
									>
										Woche
									</Text>
								</TouchableOpacity>

								<TouchableOpacity
									style={[
										styles.timeframeButton,
										timeframe === 'month' && styles.timeframeButtonActive,
										isDark ? styles.timeframeButtonDark : styles.timeframeButtonLight,
										timeframe === 'month' &&
											(isDark
												? styles.timeframeButtonActiveDark
												: styles.timeframeButtonActiveLight),
									]}
									onPress={() => handleTimeframeChange('month')}
								>
									<Text
										style={[
											styles.timeframeButtonText,
											{ color: isDark ? '#f9fafb' : '#000000' },
											timeframe === 'month' && styles.timeframeButtonTextActive,
										]}
									>
										Monat
									</Text>
								</TouchableOpacity>

								<TouchableOpacity
									style={[
										styles.timeframeButton,
										timeframe === 'year' && styles.timeframeButtonActive,
										isDark ? styles.timeframeButtonDark : styles.timeframeButtonLight,
										timeframe === 'year' &&
											(isDark
												? styles.timeframeButtonActiveDark
												: styles.timeframeButtonActiveLight),
									]}
									onPress={() => handleTimeframeChange('year')}
								>
									<Text
										style={[
											styles.timeframeButtonText,
											{ color: isDark ? '#f9fafb' : '#000000' },
											timeframe === 'year' && styles.timeframeButtonTextActive,
										]}
									>
										Jahr
									</Text>
								</TouchableOpacity>
							</View>

							{usageStats && (
								<View style={styles.statsContainer}>
									<View style={styles.statItem}>
										<Text style={[styles.statLabel, { color: isDark ? '#f9fafb' : '#000000' }]}>
											Gesamtnutzung:
										</Text>
										<Text style={[styles.statValue, { color: isDark ? '#f9fafb' : '#000000' }]}>
											{usageStats.totalUsed.toLocaleString()} Tokens
										</Text>
									</View>

									<Text style={[styles.sectionTitle, { color: isDark ? '#f9fafb' : '#000000' }]}>
										Nach Modell:
									</Text>

									{Object.entries(usageStats.byModel).length > 0 ? (
										Object.entries(usageStats.byModel).map(([model, amount]: [string, any]) => (
											<View key={model} style={styles.statItem}>
												<Text style={[styles.statLabel, { color: isDark ? '#f9fafb' : '#000000' }]}>
													{model}:
												</Text>
												<Text style={[styles.statValue, { color: isDark ? '#f9fafb' : '#000000' }]}>
													{amount.toLocaleString()} Tokens
												</Text>
											</View>
										))
									) : (
										<Text style={[styles.emptyText, { color: isDark ? '#f9fafb' : '#000000' }]}>
											Keine Nutzungsdaten für diesen Zeitraum
										</Text>
									)}
								</View>
							)}
						</View>

						{/* Transaktionshistorie */}
						<View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
							<Text style={[styles.cardTitle, { color: isDark ? '#f9fafb' : '#000000' }]}>
								Transaktionshistorie
							</Text>

							{transactions.length > 0 ? (
								transactions.map((transaction, index) => (
									<View
										key={transaction.id}
										style={[
											styles.transactionItem,
											index < transactions.length - 1 && styles.transactionItemBorder,
											isDark ? styles.transactionItemBorderDark : styles.transactionItemBorderLight,
										]}
									>
										<View style={styles.transactionHeader}>
											<Text
												style={[styles.transactionType, { color: isDark ? '#f9fafb' : '#000000' }]}
											>
												{getTransactionTypeLabel(transaction.transaction_type)}
											</Text>
											<Text
												style={[styles.transactionDate, { color: isDark ? '#f9fafb' : '#000000' }]}
											>
												{formatDate(transaction.created_at)}
											</Text>
										</View>

										<View style={styles.transactionDetails}>
											<Text
												style={[
													styles.transactionAmount,
													{
														color: getTransactionColor(
															transaction.transaction_type,
															transaction.amount
														),
													},
												]}
											>
												{transaction.amount > 0 ? '+' : ''}
												{transaction.amount.toLocaleString()} Tokens
											</Text>

											{transaction.model_used && (
												<Text
													style={[
														styles.transactionModel,
														{ color: isDark ? '#f9fafb' : '#000000' },
													]}
												>
													Modell: {transaction.model_used}
												</Text>
											)}

											{transaction.total_tokens && (
												<Text
													style={[
														styles.transactionTokens,
														{ color: isDark ? '#f9fafb' : '#000000' },
													]}
												>
													{transaction.prompt_tokens?.toLocaleString() || 0} Input +{' '}
													{transaction.completion_tokens?.toLocaleString() || 0} Output ={' '}
													{transaction.total_tokens.toLocaleString()} Tokens
												</Text>
											)}
										</View>
									</View>
								))
							) : (
								<Text style={[styles.emptyText, isDark ? styles.textDark : styles.textLight]}>
									Keine Transaktionen gefunden
								</Text>
							)}

							{transactions.length > 0 && (
								<TouchableOpacity
									style={[styles.linkButton]}
									onPress={() => {
										// Hier könnte eine Seite mit allen Transaktionen angezeigt werden
										alert('Vollständige Transaktionshistorie wird bald implementiert!');
									}}
								>
									<Text style={[styles.linkButtonText, { color: isDark ? '#818cf8' : '#4f46e5' }]}>
										Alle Transaktionen anzeigen
									</Text>
									<Ionicons
										name="chevron-forward"
										size={16}
										color={isDark ? '#818cf8' : '#4f46e5'}
									/>
								</TouchableOpacity>
							)}
						</View>
					</>
				)}
			</ScrollView>

			{/* Token Store Modal */}
			<Modal
				visible={storeVisible}
				animationType="slide"
				transparent={false}
				onRequestClose={() => setStoreVisible(false)}
			>
				<TokenStore
					onClose={() => setStoreVisible(false)}
					onPurchaseComplete={() => {
						setStoreVisible(false);
						// Aktualisiere die Daten nach dem Kauf
						const refreshData = async () => {
							try {
								const { data: sessionData } = await supabase.auth.getSession();
								const userId = sessionData?.session?.user?.id;

								if (userId) {
									const balance = await getCurrentTokenBalance(userId);
									setTokenBalance(balance);

									const transactionData = await getTokenTransactions(userId, 20);
									setTransactions(transactionData);
								}
							} catch (error) {
								console.error('Fehler beim Aktualisieren der Daten:', error);
							}
						};

						refreshData();
					}}
				/>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		width: '100%',
	},
	containerDark: {
		backgroundColor: '#111827',
	},
	containerLight: {
		backgroundColor: '#f9fafb',
	},
	scrollView: {
		flex: 1,
	},
	scrollViewContent: {
		padding: 16,
		maxWidth: 800,
		width: '100%',
		alignSelf: 'center',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	loadingText: {
		marginTop: 12,
		fontSize: 16,
	},
	card: {
		borderRadius: 8,
		padding: 16,
		marginBottom: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	cardDark: {
		backgroundColor: '#1f2937',
	},
	cardLight: {
		backgroundColor: '#ffffff',
		borderWidth: 1,
		borderColor: '#e5e7eb',
	},
	cardTitle: {
		fontSize: 18,
		fontWeight: '600',
		marginBottom: 12,
	},
	textDark: {
		color: '#f9fafb',
	},
	textLight: {
		color: '#000000',
	},
	balanceText: {
		fontSize: 36,
		fontWeight: '700',
		marginBottom: 16,
	},
	button: {
		borderRadius: 8,
		padding: 12,
		alignItems: 'center',
	},
	buttonDark: {
		backgroundColor: '#4f46e5',
	},
	buttonLight: {
		backgroundColor: '#4f46e5',
	},
	buttonText: {
		fontSize: 16,
		fontWeight: '600',
	},
	buttonTextDark: {
		color: '#ffffff',
	},
	buttonTextLight: {
		color: '#ffffff',
	},
	timeframeSelector: {
		flexDirection: 'row',
		marginBottom: 16,
	},
	timeframeButton: {
		flex: 1,
		paddingVertical: 8,
		paddingHorizontal: 4,
		alignItems: 'center',
		borderRadius: 4,
		marginHorizontal: 2,
	},
	timeframeButtonDark: {
		backgroundColor: '#374151',
	},
	timeframeButtonLight: {
		backgroundColor: '#f3f4f6',
	},
	timeframeButtonActive: {
		borderWidth: 1,
	},
	timeframeButtonActiveDark: {
		borderColor: '#818cf8',
		backgroundColor: '#312e81',
	},
	timeframeButtonActiveLight: {
		borderColor: '#4f46e5',
		backgroundColor: '#e0e7ff',
	},
	timeframeButtonText: {
		fontSize: 14,
	},
	timeframeButtonTextActive: {
		fontWeight: '600',
	},
	statsContainer: {
		marginTop: 8,
	},
	statItem: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	statLabel: {
		fontSize: 14,
	},
	statValue: {
		fontSize: 14,
		fontWeight: '600',
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: '600',
		marginTop: 16,
		marginBottom: 8,
	},
	transactionItem: {
		paddingVertical: 12,
	},
	transactionItemBorder: {
		borderBottomWidth: 1,
	},
	transactionItemBorderDark: {
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
	},
	transactionItemBorderLight: {
		borderBottomColor: 'rgba(0, 0, 0, 0.1)',
	},
	transactionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 4,
	},
	transactionType: {
		fontSize: 14,
		fontWeight: '600',
	},
	transactionDate: {
		fontSize: 12,
		opacity: 0.7,
	},
	transactionDetails: {
		marginTop: 4,
	},
	transactionAmount: {
		fontSize: 16,
		fontWeight: '600',
		marginBottom: 4,
	},
	transactionModel: {
		fontSize: 12,
		opacity: 0.8,
	},
	transactionTokens: {
		fontSize: 12,
		opacity: 0.8,
	},
	emptyText: {
		textAlign: 'center',
		padding: 16,
		opacity: 0.7,
	},
	linkButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 8,
		marginTop: 8,
	},
	linkButtonText: {
		fontSize: 14,
		marginRight: 4,
	},
	linkButtonTextDark: {
		color: '#818cf8',
	},
	linkButtonTextLight: {
		color: '#4f46e5',
	},
});
