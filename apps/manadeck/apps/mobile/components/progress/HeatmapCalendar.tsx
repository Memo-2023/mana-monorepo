import React from 'react';
import { View } from 'react-native';
import { Text } from '../ui/Text';
import { DailyProgress } from '../../store/progressStore';
import { useThemeColors } from '~/utils/themeUtils';

interface HeatmapCalendarProps {
  data: Map<string, DailyProgress>;
}

export const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({ data }) => {
  const colors = useThemeColors();
  
  // Generate grid for last 12 weeks
  const weeks = 12;
  const daysPerWeek = 7;
  const today = new Date();
  const grid: (DailyProgress | null)[][] = [];

  // Start from 12 weeks ago
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - weeks * 7 + (7 - today.getDay()));

  // Generate grid
  for (let week = 0; week < weeks; week++) {
    const weekData: (DailyProgress | null)[] = [];

    for (let day = 0; day < daysPerWeek; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + week * 7 + day);

      if (currentDate <= today) {
        const dateStr = currentDate.toISOString().split('T')[0];
        weekData.push(data.get(dateStr) || null);
      } else {
        weekData.push(null);
      }
    }

    grid.push(weekData);
  }

  const getIntensityColor = (progress: DailyProgress | null) => {
    if (!progress || progress.cards_studied === 0) return colors.muted;
    if (progress.cards_studied <= 5) return '#bbf7d0'; // green-200
    if (progress.cards_studied <= 15) return '#4ade80'; // green-400
    if (progress.cards_studied <= 30) return '#22c55e'; // green-500
    return '#16a34a'; // green-600
  };

  const weekDays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const months = [
    'Jan',
    'Feb',
    'Mär',
    'Apr',
    'Mai',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Okt',
    'Nov',
    'Dez',
  ];

  // Calculate which months to show
  const monthLabels: { month: string; week: number }[] = [];
  let lastMonth = -1;

  for (let week = 0; week < weeks; week++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + week * 7);
    const month = weekStart.getMonth();

    if (month !== lastMonth) {
      monthLabels.push({ month: months[month], week });
      lastMonth = month;
    }
  }

  return (
    <View>
      {/* Month labels */}
      <View style={{ marginBottom: 8, flexDirection: 'row' }}>
        <View style={{ width: 32 }} />
        <View style={{ flex: 1, flexDirection: 'row' }}>
          {monthLabels.map((label, index) => (
            <View key={index} style={{ flex: 1, marginLeft: label.week * 12 }}>
              <Text variant="small" style={{ color: colors.mutedForeground }}>
                {label.month}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Calendar grid */}
      <View style={{ flexDirection: 'row' }}>
        {/* Week day labels */}
        <View style={{ marginRight: 8 }}>
          {weekDays.map((day, index) => (
            <View key={index} style={{ height: 12, justifyContent: 'center', marginBottom: 2 }}>
              <Text variant="small" style={{ color: colors.mutedForeground }}>
                {index % 2 === 1 ? day : ''}
              </Text>
            </View>
          ))}
        </View>

        {/* Heatmap grid */}
        <View style={{ flex: 1, flexDirection: 'row' }}>
          {grid.map((week, weekIndex) => (
            <View key={weekIndex} style={{ marginRight: 4 }}>
              {week.map((day, dayIndex) => (
                <View
                  key={dayIndex}
                  style={{
                    height: 12,
                    width: 12,
                    borderRadius: 2,
                    backgroundColor: day === null ? 'transparent' : getIntensityColor(day),
                    marginBottom: 2
                  }}
                />
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};
