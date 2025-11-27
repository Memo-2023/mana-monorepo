import React from 'react';
import { View } from 'react-native';
import { Text } from '../ui/Text';
import { Icon } from '../ui/Icon';
import { Card } from '../ui/Card';
import { StreakInfo } from '../../store/progressStore';
import { useThemeColors } from '~/utils/themeUtils';

interface StreakCardProps {
	streakInfo: StreakInfo | null;
}

export const StreakCard: React.FC<StreakCardProps> = ({ streakInfo }) => {
	const colors = useThemeColors();

	if (!streakInfo) {
		return (
			<Card padding="lg" variant="elevated">
				<View
					style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
				>
					<View>
						<Text variant="caption" style={{ color: colors.mutedForeground }}>
							Lernstreak
						</Text>
						<Text variant="h2" style={{ color: colors.foreground }}>
							0 Tage
						</Text>
					</View>
					<View
						style={{
							height: 64,
							width: 64,
							alignItems: 'center',
							justifyContent: 'center',
							borderRadius: 32,
							backgroundColor: colors.muted,
						}}
					>
						<Text style={{ fontSize: 24 }}>💤</Text>
					</View>
				</View>
				<Text variant="caption" style={{ marginTop: 8, color: colors.mutedForeground }}>
					Starte jetzt deine erste Lernsession!
				</Text>
			</Card>
		);
	}

	const getStreakEmoji = (streak: number) => {
		if (streak === 0) return '💤';
		if (streak < 3) return '✨';
		if (streak < 7) return '🔥';
		if (streak < 14) return '💪';
		if (streak < 30) return '🚀';
		if (streak < 60) return '⭐';
		if (streak < 100) return '🏆';
		return '👑';
	};

	const getMotivationalMessage = (streak: number) => {
		if (streak === 0) return 'Zeit wieder zu lernen!';
		if (streak === 1) return 'Guter Start! Bleib dran!';
		if (streak < 3) return 'Weiter so! Baue eine Gewohnheit auf!';
		if (streak < 7) return 'Fantastisch! Fast eine Woche!';
		if (streak < 14) return 'Beeindruckend! Du bist auf Kurs!';
		if (streak < 30) return 'Unglaublich! Ein Monat ist in Sicht!';
		if (streak < 60) return 'Meisterhaft! Du bist nicht zu stoppen!';
		if (streak < 100) return 'Legendär! 100 Tage sind nah!';
		return 'Unbesiegbar! Du bist eine Lernmaschine!';
	};

	const daysSinceLastStudy = streakInfo.last_study_date
		? Math.floor((new Date().getTime() - new Date(streakInfo.last_study_date).getTime()) / 86400000)
		: 999;

	const isStreakActive = daysSinceLastStudy <= 1;

	return (
		<Card padding="lg" variant="elevated">
			<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
				<View style={{ flex: 1 }}>
					<Text variant="caption" style={{ color: colors.mutedForeground }}>
						Aktueller Streak
					</Text>
					<View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
						<Text
							variant="h2"
							style={{ color: isStreakActive ? '#ea580c' : colors.mutedForeground }}
						>
							{streakInfo.current_streak}
						</Text>
						<Text variant="h4" style={{ marginLeft: 8, color: colors.mutedForeground }}>
							{streakInfo.current_streak === 1 ? 'Tag' : 'Tage'}
						</Text>
					</View>
					<Text variant="caption" style={{ marginTop: 4, color: colors.mutedForeground }}>
						{getMotivationalMessage(streakInfo.current_streak)}
					</Text>
				</View>

				<View style={{ alignItems: 'center' }}>
					<View
						style={{
							height: 64,
							width: 64,
							alignItems: 'center',
							justifyContent: 'center',
							borderRadius: 32,
							backgroundColor: isStreakActive ? '#fed7aa' : colors.muted,
						}}
					>
						<Text style={{ fontSize: 30 }}>{getStreakEmoji(streakInfo.current_streak)}</Text>
					</View>
					{!isStreakActive && daysSinceLastStudy > 1 && (
						<Text variant="small" style={{ marginTop: 4, color: '#ef4444' }}>
							{daysSinceLastStudy}d inaktiv
						</Text>
					)}
				</View>
			</View>

			{/* Stats Row */}
			<View
				style={{
					marginTop: 16,
					flexDirection: 'row',
					justifyContent: 'space-around',
					borderTopWidth: 1,
					borderTopColor: colors.border,
					paddingTop: 12,
				}}
			>
				<View style={{ alignItems: 'center' }}>
					<Text variant="h4" style={{ fontWeight: '600', color: colors.foreground }}>
						{streakInfo.longest_streak}
					</Text>
					<Text variant="small" style={{ color: colors.mutedForeground }}>
						Längster
					</Text>
				</View>
				<View style={{ alignItems: 'center' }}>
					<Text variant="h4" style={{ fontWeight: '600', color: colors.foreground }}>
						{streakInfo.total_study_days}
					</Text>
					<Text variant="small" style={{ color: colors.mutedForeground }}>
						Gesamt
					</Text>
				</View>
				<View style={{ alignItems: 'center' }}>
					<Text variant="h4" style={{ fontWeight: '600', color: colors.foreground }}>
						{streakInfo.last_study_date
							? new Date(streakInfo.last_study_date).toLocaleDateString('de-DE', {
									day: 'numeric',
									month: 'short',
								})
							: '-'}
					</Text>
					<Text variant="small" style={{ color: colors.mutedForeground }}>
						Letztes Mal
					</Text>
				</View>
			</View>

			{/* Progress to next milestone */}
			{streakInfo.current_streak > 0 && (
				<View style={{ marginTop: 12 }}>
					<View
						style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
					>
						<Text variant="small" style={{ color: colors.mutedForeground }}>
							Nächster Meilenstein
						</Text>
						<Text variant="small" style={{ fontWeight: '500', color: colors.foreground }}>
							{streakInfo.current_streak < 7
								? `7 Tage (noch ${7 - streakInfo.current_streak})`
								: streakInfo.current_streak < 30
									? `30 Tage (noch ${30 - streakInfo.current_streak})`
									: streakInfo.current_streak < 100
										? `100 Tage (noch ${100 - streakInfo.current_streak})`
										: '365 Tage'}
						</Text>
					</View>
					<View
						style={{
							marginTop: 4,
							height: 8,
							overflow: 'hidden',
							borderRadius: 9999,
							backgroundColor: colors.muted,
						}}
					>
						<View
							style={{
								height: '100%',
								backgroundColor: '#fb923c',
								width: `${
									streakInfo.current_streak < 7
										? (streakInfo.current_streak / 7) * 100
										: streakInfo.current_streak < 30
											? (streakInfo.current_streak / 30) * 100
											: streakInfo.current_streak < 100
												? (streakInfo.current_streak / 100) * 100
												: 100
								}%`,
							}}
						/>
					</View>
				</View>
			)}
		</Card>
	);
};
