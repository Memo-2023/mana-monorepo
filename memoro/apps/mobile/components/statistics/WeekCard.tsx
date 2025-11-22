import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import colors from '~/tailwind.config.js';
import Icon from '~/components/atoms/Icon';
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

interface WeekCardProps {
  weekData: WeekData;
  isLatest?: boolean;
}

/**
 * Beautiful card component for displaying individual week statistics
 */
const WeekCard: React.FC<WeekCardProps> = ({ weekData, isLatest = false }) => {
  const { isDark, themeVariant } = useTheme();
  const { t } = useTranslation();

  const textColor = isDark ? '#FFFFFF' : '#000000';
  const textSecondaryColor = isDark ? '#CCCCCC' : '#666666';
  const contentBackgroundColor = isDark
    ? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.contentBackground
    : (colors as any).theme?.extend?.colors?.[themeVariant]?.contentBackground;
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const primaryColor = isDark
    ? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.primary
    : (colors as any).theme?.extend?.colors?.[themeVariant]?.primary;

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

  const formatDateRange = (start: Date, end: Date) => {
    const startStr = start.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
    });
    const endStr = end.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
    });
    return `${startStr} - ${endStr}`;
  };

  const getProductivityLevel = () => {
    if (weekData.memos >= 10)
      return { level: t('statistics.very_high'), color: '#4CAF50', icon: 'trending-up' };
    if (weekData.memos >= 5)
      return { level: t('statistics.high'), color: '#8BC34A', icon: 'trending-up' };
    if (weekData.memos >= 3)
      return { level: t('statistics.medium'), color: '#FFC107', icon: 'remove' };
    if (weekData.memos >= 1)
      return { level: t('statistics.low'), color: '#FF9800', icon: 'trending-down' };
    return { level: t('statistics.none'), color: '#F44336', icon: 'trending-down' };
  };

  const productivity = getProductivityLevel();

  return (
    <View
      style={{
        backgroundColor: contentBackgroundColor,
        borderRadius: 16,
        borderWidth: isLatest ? 2 : 1.5,
        borderColor: isLatest ? primaryColor : borderColor,
        padding: 20,
        marginBottom: 12,
        ...(isLatest && {
          shadowColor: primaryColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }),
      }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}>
        <View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                color: textColor,
              }}>
              {t('statistics.week_abbr')} {weekData.weekNumber}
            </Text>
            {isLatest && (
              <View
                style={{
                  backgroundColor: primaryColor,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 12,
                }}>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: 'bold',
                    color: '#FFFFFF',
                  }}>
                  {t('statistics.current')}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={{
              fontSize: 14,
              color: textSecondaryColor,
              marginTop: 2,
            }}>
            {formatDateRange(weekData.startDate, weekData.endDate)} • {weekData.year}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}>
          <Icon name={productivity.icon} size={16} color={productivity.color} />
          <Text
            style={{
              fontSize: 12,
              color: productivity.color,
              fontWeight: '500',
            }}>
            {productivity.level}
          </Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 16,
        }}>
        {/* Memos */}
        <View
          style={{
            flex: 1,
            minWidth: 120,
            alignItems: 'center',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            borderRadius: 12,
            padding: 12,
          }}>
          <Icon name="document-text-outline" size={20} color={primaryColor} />
          <Text
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: textColor,
              marginTop: 8,
            }}>
            {weekData.memos}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: textSecondaryColor,
            }}>
            {t('statistics.memos')}
          </Text>
        </View>

        {/* Memories */}
        <View
          style={{
            flex: 1,
            minWidth: 120,
            alignItems: 'center',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            borderRadius: 12,
            padding: 12,
          }}>
          <Icon name="sparkles-outline" size={20} color={primaryColor} />
          <Text
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: textColor,
              marginTop: 8,
            }}>
            {weekData.memories}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: textSecondaryColor,
            }}>
            {t('statistics.memories')}
          </Text>
        </View>

        {/* Duration */}
        <View
          style={{
            flex: 1,
            minWidth: 120,
            alignItems: 'center',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            borderRadius: 12,
            padding: 12,
          }}>
          <Icon name="volume-high-outline" size={20} color={primaryColor} />
          <Text
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: textColor,
              marginTop: 8,
            }}>
            {formatDuration(weekData.duration)}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: textSecondaryColor,
            }}>
            {t('statistics.recordings')}
          </Text>
        </View>

        {/* Words */}
        <View
          style={{
            flex: 1,
            minWidth: 120,
            alignItems: 'center',
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
            borderRadius: 12,
            padding: 12,
          }}>
          <Icon name="text-outline" size={20} color={primaryColor} />
          <Text
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: textColor,
              marginTop: 8,
            }}>
            {weekData.words.toLocaleString()}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: textSecondaryColor,
            }}>
            {t('statistics.words')}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View
        style={{
          marginTop: 16,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: borderColor,
        }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}>
          <Text
            style={{
              fontSize: 12,
              color: textSecondaryColor,
            }}>
            {t('statistics.activity_level')}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: productivity.color,
              fontWeight: '500',
            }}>
            {weekData.memos} / 10 {t('statistics.memos')}
          </Text>
        </View>

        <View
          style={{
            height: 6,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            borderRadius: 3,
            overflow: 'hidden',
          }}>
          <View
            style={{
              height: '100%',
              width: `${Math.min(100, (weekData.memos / 10) * 100)}%`,
              backgroundColor: productivity.color,
              borderRadius: 3,
            }}
          />
        </View>
      </View>
    </View>
  );
};

export default WeekCard;
