import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeProvider';
import { useTranslation } from 'react-i18next';
import colors from '~/tailwind.config.js';

export interface CostItem {
  action: string;
  actionKey?: string; // Translation key for the action
  cost: number;
  icon: keyof typeof Ionicons.glyphMap;
}

interface CostCardProps {
  title: string;
  costs: CostItem[];
}

export const CostCard: React.FC<CostCardProps> = ({ 
  title,
  costs
}) => {
  const { isDark, themeVariant, tw } = useTheme();
  const { t } = useTranslation();
  
  // Theme-aware colors using the same system as MemoPreview and SettingsToggle
  const themeColors = (colors as any).theme?.extend?.colors;
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const secondaryTextColor = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
  const bgColor = isDark
    ? themeColors?.dark?.[themeVariant]?.contentBackground || '#1E1E1E'
    : themeColors?.[themeVariant]?.contentBackground || '#FFFFFF';
  const borderColor = isDark
    ? themeColors?.dark?.[themeVariant]?.border || '#424242'
    : themeColors?.[themeVariant]?.border || '#e6e6e6';
  const accentColor = '#4287f5'; // Konsistente Mana-Farbe
  
  return (
    <View
      style={{
        backgroundColor: bgColor,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: borderColor
      }}
    >
      <Text style={{ color: textColor, fontSize: 20, fontWeight: 'bold' as const, marginBottom: 16 }}>{title}</Text>
      
      <View style={{ gap: 12 }}>
        {costs.map((item, index) => (
          <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name={item.icon} size={18} color={accentColor} />
              <Text style={{ color: secondaryTextColor, fontSize: 14, marginLeft: 8 }}>
                {item.actionKey ? t(item.actionKey, item.action) : item.action}
              </Text>
            </View>
            <Text style={{ color: textColor, fontSize: 16, fontWeight: '600' as const }}>
              {t('subscription.mana_amount', '{{amount}} Mana', { amount: item.cost })}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default CostCard;
