import React from 'react';
import { View } from 'react-native';
import { Text } from './Text';
import { Card } from './Card';
import { useThemeColors } from '~/utils/themeUtils';
import { spacing } from '~/utils/spacing';

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
  noPadding?: boolean;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children, noPadding = false }) => {
  const colors = useThemeColors();

  return (
    <Card padding="none" variant="elevated" style={{ marginBottom: spacing.section }}>
      <View
        style={{
          borderBottomWidth: noPadding ? 0 : 1,
          borderBottomColor: colors.border,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.content.small,
          paddingBottom: noPadding ? 0 : spacing.content.small,
        }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground }}>
          {title}
        </Text>
      </View>
      {children}
    </Card>
  );
};