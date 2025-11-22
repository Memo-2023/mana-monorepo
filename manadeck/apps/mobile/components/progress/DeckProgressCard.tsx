import React from 'react';
import { View, Pressable } from 'react-native';
import { Icon } from '../ui/Icon';
import { Text } from '../ui/Text';
import { Card } from '../ui/Card';
import { DeckProgress } from '../../store/progressStore';
import { router } from 'expo-router';
import { useThemeColors } from '~/utils/themeUtils';

interface DeckProgressCardProps {
  progress: DeckProgress;
}

export const DeckProgressCard: React.FC<DeckProgressCardProps> = ({ progress }) => {
  const colors = useThemeColors();
  
  const getMasteryColor = (percentage: number) => {
    if (percentage >= 80) return '#16a34a'; // green-600
    if (percentage >= 60) return '#2563eb'; // blue-600
    if (percentage >= 40) return '#ca8a04'; // yellow-600
    if (percentage >= 20) return '#ea580c'; // orange-600
    return colors.mutedForeground;
  };

  const getMasteryIcon = (percentage: number) => {
    if (percentage >= 80) return 'trophy';
    if (percentage >= 60) return 'medal';
    if (percentage >= 40) return 'ribbon';
    if (percentage >= 20) return 'school';
    return 'book';
  };

  return (
    <Pressable
      onPress={() => router.push(`/deck/${progress.deck_id}`)}
      style={({ pressed }) => pressed && { opacity: 0.7 }}>
      <Card padding="md" variant="elevated">
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: colors.foreground }} numberOfLines={1}>
                {progress.deck_name}
              </Text>
              <Icon
                name={getMasteryIcon(progress.completion_percentage)}
                library="Ionicons"
                size={20}
                color={getMasteryColor(progress.completion_percentage)}
              />
            </View>

            {/* Progress Bar */}
            <View style={{ marginTop: 8, height: 8, overflow: 'hidden', borderRadius: 9999, backgroundColor: colors.muted }}>
              <View
                style={{ 
                  height: '100%', 
                  backgroundColor: '#3b82f6',
                  width: `${progress.completion_percentage}%` 
                }}
              />
            </View>

            {/* Stats */}
            <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ height: 8, width: 8, borderRadius: 9999, backgroundColor: '#10b981' }} />
                  <Text style={{ marginLeft: 4, fontSize: 12, color: colors.mutedForeground }}>
                    {progress.mastered_cards} gemeistert
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ height: 8, width: 8, borderRadius: 9999, backgroundColor: '#eab308' }} />
                  <Text style={{ marginLeft: 4, fontSize: 12, color: colors.mutedForeground }}>
                    {progress.learning_cards} lernen
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ height: 8, width: 8, borderRadius: 9999, backgroundColor: colors.muted }} />
                  <Text style={{ marginLeft: 4, fontSize: 12, color: colors.mutedForeground }}>
                    {progress.new_cards} neu
                  </Text>
                </View>
              </View>

              <Text
                style={{ fontSize: 14, fontWeight: 'bold', color: getMasteryColor(progress.completion_percentage) }}>
                {progress.completion_percentage}%
              </Text>
            </View>

            {/* Ease Factor */}
            <View style={{ marginTop: 4, flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="speedometer-outline" library="Ionicons" size={12} color={colors.mutedForeground} />
              <Text style={{ marginLeft: 4, fontSize: 12, color: colors.mutedForeground }}>
                Schwierigkeit: {progress.average_ease_factor.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </Pressable>
  );
};
