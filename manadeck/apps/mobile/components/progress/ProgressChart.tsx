import React from 'react';
import { View } from 'react-native';
import { Text } from '../ui/Text';
import { useProgressStore } from '../../store/progressStore';
import { useThemeColors } from '~/utils/themeUtils';

interface ProgressChartProps {
  type: 'accuracy' | 'cards' | 'time';
  period: 'week' | 'month' | 'year';
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ type, period }) => {
  const { getChartData } = useProgressStore();
  const data = getChartData(type);
  const colors = useThemeColors();

  if (data.length === 0) {
    return (
      <View style={{ height: 192, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.mutedForeground }}>Keine Daten verfügbar</Text>
      </View>
    );
  }

  const getYLabel = () => {
    switch (type) {
      case 'accuracy':
        return 'Genauigkeit (%)';
      case 'cards':
        return 'Karten';
      case 'time':
        return 'Minuten';
      default:
        return '';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'accuracy':
        return '#10B981'; // green
      case 'cards':
        return '#3B82F6'; // blue
      case 'time':
        return '#F59E0B'; // amber
      default:
        return '#6B7280';
    }
  };

  // Get max value for scaling
  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));

  // Simple bar chart implementation
  return (
    <View>
      <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text variant="caption" style={{ fontWeight: '500', color: colors.foreground }}>
          {getYLabel()}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ height: 8, width: 8, borderRadius: 9999, backgroundColor: getColor() }} />
          <Text variant="caption" style={{ marginLeft: 4, color: colors.mutedForeground }}>
            Ø {Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length)}
            {type === 'accuracy' ? '%' : ''}
          </Text>
        </View>
      </View>

      {/* Simple Bar Chart */}
      <View style={{ 
        height: 192, 
        borderBottomWidth: 1, 
        borderBottomColor: colors.border,
        borderLeftWidth: 1, 
        borderLeftColor: colors.border 
      }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 4 }}>
          {data.slice(-7).map((item, index) => {
            const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            return (
              <View key={index} style={{ flex: 1, alignItems: 'center' }}>
                <View
                  style={{
                    marginHorizontal: 2,
                    width: '100%',
                    borderTopLeftRadius: 4,
                    borderTopRightRadius: 4,
                    height: `${height}%`,
                    backgroundColor: getColor(),
                    opacity: 0.8,
                  }}
                />
                <Text variant="small" style={{ marginTop: 4, color: colors.mutedForeground }}>
                  {item.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Summary Stats */}
      <View style={{ 
        marginTop: 8, 
        flexDirection: 'row', 
        justifyContent: 'space-around', 
        borderTopWidth: 1, 
        borderTopColor: colors.border, 
        paddingTop: 8 
      }}>
        <View style={{ alignItems: 'center' }}>
          <Text variant="small" style={{ color: colors.mutedForeground }}>
            Min
          </Text>
          <Text variant="caption" style={{ fontWeight: '600', color: colors.foreground }}>
            {Math.min(...data.map((d) => d.value))}
            {type === 'accuracy' ? '%' : ''}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text variant="small" style={{ color: colors.mutedForeground }}>
            Max
          </Text>
          <Text variant="caption" style={{ fontWeight: '600', color: colors.foreground }}>
            {Math.max(...data.map((d) => d.value))}
            {type === 'accuracy' ? '%' : ''}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text variant="small" style={{ color: colors.mutedForeground }}>
            Gesamt
          </Text>
          <Text variant="caption" style={{ fontWeight: '600', color: colors.foreground }}>
            {type === 'accuracy'
              ? `${Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length)}%`
              : data.reduce((sum, d) => sum + d.value, 0)}
          </Text>
        </View>
      </View>
    </View>
  );
};
