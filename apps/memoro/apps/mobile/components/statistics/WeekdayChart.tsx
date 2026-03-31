import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useTranslation } from 'react-i18next';

interface WeekdayChartProps {
	data: { [key: string]: number };
	maxEntries?: number;
	title?: string;
}

/**
 * Simple chart component for displaying weekday distribution
 */
const WeekdayChart: React.FC<WeekdayChartProps> = ({ data, maxEntries = 3, title }) => {
	const { isDark } = useTheme();
	const { t } = useTranslation();
	const textColor = isDark ? '#FFFFFF' : '#000000';
	const textSecondaryColor = isDark ? '#CCCCCC' : '#666666';
	const defaultTitle = t('statistics.recordings_per_weekday');

	const sortedEntries = Object.entries(data)
		.sort(([, a], [, b]) => b - a)
		.slice(0, maxEntries);

	return (
		<View
			style={{
				paddingVertical: 12,
				paddingHorizontal: 16,
			}}
		>
			<Text
				style={{
					fontSize: 14,
					fontWeight: '500',
					color: textColor,
					marginBottom: 8,
				}}
			>
				{title || defaultTitle}
			</Text>
			{sortedEntries.map(([day, count], index) => (
				<View
					key={day}
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						marginBottom: 4,
					}}
				>
					<Text
						style={{
							fontSize: 12,
							color: textSecondaryColor,
							flex: 1,
						}}
					>
						{day}
					</Text>
					<Text
						style={{
							fontSize: 12,
							color: textSecondaryColor,
							fontWeight: '500',
						}}
					>
						{count} {t('statistics.memos')}
					</Text>
				</View>
			))}
		</View>
	);
};

export default WeekdayChart;
