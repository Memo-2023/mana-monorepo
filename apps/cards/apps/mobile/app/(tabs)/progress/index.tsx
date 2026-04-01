import React, { useEffect, useState } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Text } from '~/components/ui/Text';
import { Icon } from '~/components/ui/Icon';
import { useProgressStore } from '~/store/progressStore';
import { useAuthStore } from '~/store/authStore';
import { Card } from '~/components/ui/Card';
import { HeatmapCalendar } from '~/components/progress/HeatmapCalendar';
import { ProgressChart } from '~/components/progress/ProgressChart';
import { StreakCard } from '~/components/progress/StreakCard';
import { DeckProgressCard } from '~/components/progress/DeckProgressCard';
import { useThemeColors } from '~/utils/themeUtils';
import { PageHeader } from '~/components/ui/PageHeader';
import { spacing } from '~/utils/spacing';

export default function ProgressScreen() {
	const { user } = useAuthStore();
	const colors = useThemeColors(); // This triggers theme reactivity
	const {
		dailyProgress,
		streakInfo,
		deckProgress,
		statistics,
		selectedPeriod,
		isLoading,
		fetchDailyProgress,
		fetchStreakInfo,
		fetchDeckProgress,
		fetchStatistics,
		setSelectedPeriod,
	} = useProgressStore();

	const [activeChart, setActiveChart] = useState<'accuracy' | 'cards' | 'time'>('cards');

	useEffect(() => {
		if (user) {
			loadProgressData();
		}
	}, [user, selectedPeriod]);

	const loadProgressData = async () => {
		if (!user) return;

		const endDate = new Date();
		const startDate = new Date();

		// Get data for selected period + extra for heatmap
		switch (selectedPeriod) {
			case 'week':
				startDate.setDate(endDate.getDate() - 90); // 3 months for heatmap
				break;
			case 'month':
				startDate.setDate(endDate.getDate() - 90);
				break;
			case 'year':
				startDate.setFullYear(endDate.getFullYear() - 1);
				break;
		}

		await Promise.all([
			fetchDailyProgress(user.id, startDate, endDate),
			fetchStreakInfo(user.id),
			fetchDeckProgress(user.id),
			fetchStatistics(user.id),
		]);
	};

	if (isLoading && dailyProgress.size === 0) {
		return (
			<View style={{ flex: 1, backgroundColor: colors.background }}>
				<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
					<ActivityIndicator size="large" color={colors.primary} />
					<Text style={{ marginTop: 8, color: colors.mutedForeground }}>Lade Fortschritt...</Text>
				</View>
			</View>
		);
	}

	return (
		<View style={{ flex: 1, backgroundColor: colors.background }}>
			<ScrollView showsVerticalScrollIndicator={false}>
				<PageHeader title="Fortschritt" />

				{/* Content Wrapper */}
				<View
					style={{
						paddingHorizontal: spacing.container.horizontal,
						paddingTop: spacing.container.top,
					}}
				>
					{/* Streak Section */}
					<View style={{ marginBottom: spacing.section }}>
						<StreakCard streakInfo={streakInfo} />
					</View>

					{/* Heatmap Calendar */}
					<Card padding="lg" variant="elevated" style={{ marginBottom: spacing.section }}>
						<Text
							style={{
								marginBottom: spacing.content.small,
								fontSize: 18,
								fontWeight: '600',
								color: colors.foreground,
							}}
						>
							Aktivitätskalender
						</Text>
						<HeatmapCalendar data={dailyProgress} />
						<View
							style={{
								marginTop: spacing.content.small,
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'center',
								gap: spacing.lg,
							}}
						>
							<View style={{ flexDirection: 'row', alignItems: 'center' }}>
								<View
									style={{ height: 12, width: 12, borderRadius: 2, backgroundColor: colors.muted }}
								/>
								<Text style={{ marginLeft: 4, fontSize: 12, color: colors.mutedForeground }}>
									Keine
								</Text>
							</View>
							<View style={{ flexDirection: 'row', alignItems: 'center' }}>
								<View
									style={{ height: 12, width: 12, borderRadius: 2, backgroundColor: '#bbf7d0' }}
								/>
								<Text style={{ marginLeft: 4, fontSize: 12, color: colors.mutedForeground }}>
									Wenig
								</Text>
							</View>
							<View style={{ flexDirection: 'row', alignItems: 'center' }}>
								<View
									style={{ height: 12, width: 12, borderRadius: 2, backgroundColor: '#4ade80' }}
								/>
								<Text style={{ marginLeft: 4, fontSize: 12, color: colors.mutedForeground }}>
									Mittel
								</Text>
							</View>
							<View style={{ flexDirection: 'row', alignItems: 'center' }}>
								<View
									style={{ height: 12, width: 12, borderRadius: 2, backgroundColor: '#16a34a' }}
								/>
								<Text style={{ marginLeft: 4, fontSize: 12, color: colors.mutedForeground }}>
									Viel
								</Text>
							</View>
						</View>
					</Card>

					{/* Charts Section */}
					<Card padding="lg" variant="elevated" style={{ marginBottom: spacing.section }}>
						{/* Period Selector */}
						<View
							style={{
								marginBottom: spacing.content.title,
								flexDirection: 'row',
								justifyContent: 'space-between',
							}}
						>
							<Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground }}>
								Statistiken
							</Text>
							<View
								style={{
									flexDirection: 'row',
									borderRadius: 8,
									backgroundColor: colors.muted,
									padding: 4,
								}}
							>
								{(['week', 'month', 'year'] as const).map((period) => (
									<Pressable
										key={period}
										onPress={() => setSelectedPeriod(period)}
										style={({ pressed }) => ({
											borderRadius: 6,
											paddingHorizontal: 12,
											paddingVertical: 4,
											backgroundColor: selectedPeriod === period ? colors.surface : 'transparent',
											opacity: pressed ? 0.7 : 1,
											...(selectedPeriod === period && {
												shadowColor: '#000',
												shadowOffset: { width: 0, height: 1 },
												shadowOpacity: 0.1,
												shadowRadius: 2,
												elevation: 2,
											}),
										})}
									>
										<Text
											style={{
												fontSize: 14,
												fontWeight: selectedPeriod === period ? '500' : '400',
												color:
													selectedPeriod === period ? colors.foreground : colors.mutedForeground,
											}}
										>
											{period === 'week' ? 'Woche' : period === 'month' ? 'Monat' : 'Jahr'}
										</Text>
									</Pressable>
								))}
							</View>
						</View>

						{/* Chart Type Selector */}
						<View
							style={{
								marginBottom: spacing.content.title,
								flexDirection: 'row',
								gap: spacing.sm,
							}}
						>
							{[
								{ key: 'cards', label: 'Karten', icon: 'card-outline' },
								{ key: 'accuracy', label: 'Genauigkeit', icon: 'checkmark-circle-outline' },
								{ key: 'time', label: 'Zeit', icon: 'time-outline' },
							].map((type) => (
								<Pressable
									key={type.key}
									onPress={() => setActiveChart(type.key as any)}
									style={({ pressed }) => ({
										flex: 1,
										flexDirection: 'row',
										alignItems: 'center',
										justifyContent: 'center',
										borderRadius: 8,
										borderWidth: 1,
										padding: 8,
										borderColor: activeChart === type.key ? colors.primary : colors.border,
										backgroundColor:
											activeChart === type.key ? `${colors.primary}15` : colors.surface,
										opacity: pressed ? 0.7 : 1,
									})}
								>
									<Icon
										name={type.icon}
										size={16}
										color={activeChart === type.key ? colors.primary : colors.mutedForeground}
										library="Ionicons"
									/>
									<Text
										style={{
											marginLeft: 4,
											fontSize: 14,
											fontWeight: activeChart === type.key ? '500' : '400',
											color: activeChart === type.key ? colors.primary : colors.mutedForeground,
										}}
									>
										{type.label}
									</Text>
								</Pressable>
							))}
						</View>

						{/* Chart */}
						<ProgressChart type={activeChart} period={selectedPeriod} />
					</Card>

					{/* Statistics Overview */}
					{statistics && (
						<Card padding="lg" variant="elevated" style={{ marginBottom: spacing.section }}>
							<Text
								style={{
									marginBottom: spacing.content.title,
									fontSize: 18,
									fontWeight: '600',
									color: colors.foreground,
								}}
							>
								Gesamt-Statistiken
							</Text>

							<View style={{ gap: spacing.content.small }}>
								<View
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										justifyContent: 'space-between',
									}}
								>
									<View style={{ flexDirection: 'row', alignItems: 'center' }}>
										<Icon
											name="card-outline"
											size={20}
											color={colors.mutedForeground}
											library="Ionicons"
										/>
										<Text style={{ marginLeft: 8, color: colors.mutedForeground }}>
											Karten gelernt
										</Text>
									</View>
									<Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground }}>
										{statistics.total_cards_studied}
									</Text>
								</View>

								<View
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										justifyContent: 'space-between',
									}}
								>
									<View style={{ flexDirection: 'row', alignItems: 'center' }}>
										<Icon
											name="time-outline"
											size={20}
											color={colors.mutedForeground}
											library="Ionicons"
										/>
										<Text style={{ marginLeft: 8, color: colors.mutedForeground }}>Lernzeit</Text>
									</View>
									<Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground }}>
										{Math.floor(statistics.total_study_time_minutes / 60)}h{' '}
										{statistics.total_study_time_minutes % 60}min
									</Text>
								</View>

								<View
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										justifyContent: 'space-between',
									}}
								>
									<View style={{ flexDirection: 'row', alignItems: 'center' }}>
										<Icon
											name="trending-up-outline"
											size={20}
											color={colors.mutedForeground}
											library="Ionicons"
										/>
										<Text style={{ marginLeft: 8, color: colors.mutedForeground }}>
											Durchschnittliche Genauigkeit
										</Text>
									</View>
									<Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground }}>
										{statistics.average_accuracy}%
									</Text>
								</View>

								<View
									style={{
										flexDirection: 'row',
										alignItems: 'center',
										justifyContent: 'space-between',
									}}
								>
									<View style={{ flexDirection: 'row', alignItems: 'center' }}>
										<Icon
											name="sunny-outline"
											size={20}
											color={colors.mutedForeground}
											library="Ionicons"
										/>
										<Text style={{ marginLeft: 8, color: colors.mutedForeground }}>
											Lieblings-Lernzeit
										</Text>
									</View>
									<Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground }}>
										{statistics.favorite_time_of_day}
									</Text>
								</View>
							</View>
						</Card>
					)}

					{/* Deck Progress */}
					<View style={{ marginBottom: spacing.section }}>
						<Text
							style={{
								marginBottom: spacing.content.title,
								fontSize: 18,
								fontWeight: '600',
								color: colors.foreground,
							}}
						>
							Deck-Fortschritt
						</Text>
						{deckProgress.length > 0 ? (
							<View style={{ gap: spacing.content.item }}>
								{deckProgress.map((deck) => (
									<DeckProgressCard key={deck.deck_id} progress={deck} />
								))}
							</View>
						) : (
							<Card padding="lg" variant="outlined">
								<Text style={{ textAlign: 'center', color: colors.mutedForeground }}>
									Noch keine Decks vorhanden
								</Text>
							</Card>
						)}
					</View>
				</View>
			</ScrollView>
		</View>
	);
}
