import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import colors from '~/tailwind.config.js';
import { useTranslation } from 'react-i18next';

interface WeekData {
	weekNumber: number;
	year: number;
	startDate: Date;
	endDate: Date;
	memos: number;
	memories: number;
	duration: number;
	words: number;
}

interface WeeklyChartProps {
	data: WeekData[];
}

/**
 * Beautiful visual chart component for displaying weekly statistics
 */
const WeeklyChart: React.FC<WeeklyChartProps> = ({ data }) => {
	const { isDark, themeVariant } = useTheme();
	const { t } = useTranslation();
	const screenWidth = Dimensions.get('window').width;
	const chartWidth = screenWidth - 80; // Account for padding

	const textColor = isDark ? '#FFFFFF' : '#000000';
	const textSecondaryColor = isDark ? '#CCCCCC' : '#666666';
	const contentBackgroundColor = isDark
		? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.contentBackground
		: (colors as any).theme?.extend?.colors?.[themeVariant]?.contentBackground;
	const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
	const primaryColor = isDark
		? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.primary
		: (colors as any).theme?.extend?.colors?.[themeVariant]?.primary;

	if (data.length === 0) return null;

	// Find max values for scaling
	const maxMemos = Math.max(...data.map((w) => w.memos));
	const maxMemories = Math.max(...data.map((w) => w.memories));
	const maxWords = Math.max(...data.map((w) => w.words));

	// Bar width calculation
	const barWidth = Math.max(20, (chartWidth - data.length * 8) / data.length);

	const formatDuration = (seconds: number): string => {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);

		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		} else if (minutes > 0) {
			return `${minutes}m`;
		} else {
			return `${seconds}s`;
		}
	};

	const formatWeekLabel = (week: WeekData) => {
		return `${t('statistics.week_abbr')}${week.weekNumber}`;
	};

	return (
		<View
			style={{
				backgroundColor: contentBackgroundColor,
				borderRadius: 16,
				borderWidth: 1.5,
				borderColor: borderColor,
				padding: 20,
			}}
		>
			{/* Chart Title */}
			<Text
				style={{
					fontSize: 16,
					fontWeight: '600',
					color: textColor,
					marginBottom: 20,
					textAlign: 'center',
				}}
			>
				{t('statistics.memo_activity_recent_weeks', 'Memo-Aktivität der letzten Wochen')}
			</Text>

			{/* Bar Chart */}
			<View
				style={{
					height: 200,
					flexDirection: 'row',
					alignItems: 'flex-end',
					justifyContent: 'space-around',
					marginBottom: 20,
				}}
			>
				{data
					.slice()
					.reverse()
					.map((week, index) => {
						const memoHeight = maxMemos > 0 ? (week.memos / maxMemos) * 150 : 0;
						const memoryHeight = maxMemories > 0 ? (week.memories / maxMemories) * 150 : 0;

						return (
							<View
								key={`${week.year}-W${week.weekNumber}`}
								style={{
									alignItems: 'center',
									width: barWidth,
								}}
							>
								{/* Bars Container */}
								<View
									style={{
										height: 150,
										flexDirection: 'row',
										alignItems: 'flex-end',
										justifyContent: 'center',
										gap: 2,
									}}
								>
									{/* Memo Bar */}
									<View
										style={{
											width: Math.max(8, barWidth / 3),
											height: Math.max(2, memoHeight),
											backgroundColor: primaryColor,
											borderRadius: 2,
											opacity: 0.8,
										}}
									/>

									{/* Memory Bar */}
									<View
										style={{
											width: Math.max(8, barWidth / 3),
											height: Math.max(2, memoryHeight),
											backgroundColor: primaryColor,
											borderRadius: 2,
											opacity: 0.5,
										}}
									/>
								</View>

								{/* Week Label */}
								<Text
									style={{
										fontSize: 10,
										color: textSecondaryColor,
										marginTop: 8,
										textAlign: 'center',
									}}
								>
									{formatWeekLabel(week)}
								</Text>

								{/* Value Label */}
								<Text
									style={{
										fontSize: 9,
										color: textSecondaryColor,
										marginTop: 2,
										textAlign: 'center',
									}}
								>
									{week.memos}
								</Text>
							</View>
						);
					})}
			</View>

			{/* Legend */}
			<View
				style={{
					flexDirection: 'row',
					justifyContent: 'center',
					gap: 20,
					marginBottom: 15,
				}}
			>
				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						gap: 6,
					}}
				>
					<View
						style={{
							width: 12,
							height: 8,
							backgroundColor: primaryColor,
							borderRadius: 2,
							opacity: 0.8,
						}}
					/>
					<Text
						style={{
							fontSize: 12,
							color: textSecondaryColor,
						}}
					>
						{t('statistics.memos')}
					</Text>
				</View>

				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						gap: 6,
					}}
				>
					<View
						style={{
							width: 12,
							height: 8,
							backgroundColor: primaryColor,
							borderRadius: 2,
							opacity: 0.5,
						}}
					/>
					<Text
						style={{
							fontSize: 12,
							color: textSecondaryColor,
						}}
					>
						{t('statistics.memories')}
					</Text>
				</View>
			</View>

			{/* Summary Stats */}
			<View
				style={{
					borderTopWidth: 1,
					borderTopColor: borderColor,
					paddingTop: 15,
					flexDirection: 'row',
					justifyContent: 'space-around',
				}}
			>
				<View style={{ alignItems: 'center' }}>
					<Text
						style={{
							fontSize: 18,
							fontWeight: 'bold',
							color: textColor,
						}}
					>
						{data.reduce((sum, week) => sum + week.memos, 0)}
					</Text>
					<Text
						style={{
							fontSize: 12,
							color: textSecondaryColor,
						}}
					>
						{t('statistics.memos')}
					</Text>
				</View>

				<View style={{ alignItems: 'center' }}>
					<Text
						style={{
							fontSize: 18,
							fontWeight: 'bold',
							color: textColor,
						}}
					>
						{data.reduce((sum, week) => sum + week.memories, 0)}
					</Text>
					<Text
						style={{
							fontSize: 12,
							color: textSecondaryColor,
						}}
					>
						{t('statistics.memories')}
					</Text>
				</View>

				<View style={{ alignItems: 'center' }}>
					<Text
						style={{
							fontSize: 18,
							fontWeight: 'bold',
							color: textColor,
						}}
					>
						{formatDuration(data.reduce((sum, week) => sum + week.duration, 0))}
					</Text>
					<Text
						style={{
							fontSize: 12,
							color: textSecondaryColor,
						}}
					>
						{t('statistics.total', 'Gesamt')}
					</Text>
				</View>
			</View>
		</View>
	);
};

export default WeeklyChart;
