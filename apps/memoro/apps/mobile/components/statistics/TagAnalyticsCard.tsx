import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import colors from '~/tailwind.config.js';
import StatRow from './StatRow';
import { useTranslation } from 'react-i18next';

interface TagData {
  name: string;
  count: number;
  color: string;
}

interface TagAnalyticsCardProps {
  totalTags: number;
  assignedTags: number;
  memosWithoutTags: number;
  averageTagsPerMemo: number;
  mostUsedTags: TagData[];
}

/**
 * Specialized card component for displaying tag analytics
 */
const TagAnalyticsCard: React.FC<TagAnalyticsCardProps> = ({
  totalTags,
  assignedTags,
  memosWithoutTags,
  averageTagsPerMemo,
  mostUsedTags,
}) => {
  const { isDark, themeVariant } = useTheme();
  const { t } = useTranslation();

  const textColor = isDark ? '#FFFFFF' : '#000000';
  const textSecondaryColor = isDark ? '#CCCCCC' : '#666666';
  const contentBackgroundColor = isDark
    ? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.contentBackground
    : (colors as any).theme?.extend?.colors?.[themeVariant]?.contentBackground;
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  return (
    <View
      style={{
        backgroundColor: contentBackgroundColor,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: borderColor,
        overflow: 'hidden',
      }}>
      <StatRow
        title={t('statistics.total_tags')}
        value={totalTags.toString()}
        icon="pricetags-outline"
      />
      <StatRow
        title={t('statistics.assigned_tags')}
        value={assignedTags.toString()}
        icon="checkmark-circle-outline"
      />
      <StatRow
        title={t('statistics.memos_without_tags')}
        value={memosWithoutTags.toString()}
        icon="help-circle-outline"
      />
      <StatRow
        title={t('statistics.avg_tags_per_memo')}
        value={averageTagsPerMemo.toString()}
        icon="analytics-outline"
      />
      {mostUsedTags.length > 0 && (
        <View
          style={{
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderBottomWidth: 1,
            borderBottomColor: borderColor,
          }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '500',
              color: textColor,
              marginBottom: 8,
            }}>
            {t('statistics.most_used_tags')}
          </Text>
          {mostUsedTags.slice(0, 3).map((tag, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 4,
              }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: tag.color,
                  marginRight: 8,
                }}
              />
              <Text
                style={{
                  fontSize: 12,
                  color: textSecondaryColor,
                  flex: 1,
                }}>
                {tag.name}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: textSecondaryColor,
                  fontWeight: '500',
                }}>
                {tag.count}x
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default TagAnalyticsCard;
