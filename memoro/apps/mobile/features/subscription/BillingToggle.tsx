import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useTranslation } from 'react-i18next';
import colors from '~/tailwind.config.js';

export type BillingCycle = 'monthly' | 'yearly';

interface BillingToggleProps {
  billingCycle: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
  yearlyDiscount?: string;
}

export const BillingToggle: React.FC<BillingToggleProps> = ({
  billingCycle,
  onChange,
  yearlyDiscount = '33%'
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
  const selectedBgColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';
  
  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: bgColor,
      borderRadius: 8,
      marginBottom: 8, // Reduced from 24 to 8
      padding: 4,
      maxWidth: 480,
      marginHorizontal: 'auto'
    }}>
      <Pressable
        style={{
          flex: 1,
          paddingVertical: 12,
          alignItems: 'center',
          borderRadius: 6,
          flexDirection: 'row',
          justifyContent: 'center',
          backgroundColor: billingCycle === 'monthly' ? selectedBgColor : 'transparent'
        }}
        onPress={() => onChange('monthly')}
      >
        <Text 
          style={{
            color: billingCycle === 'monthly' ? accentColor : textColor,
            fontSize: 14,
            fontWeight: billingCycle === 'monthly' ? 'bold' : 'normal' as const
          }}
        >
          {t('subscription.monthly')}
        </Text>
      </Pressable>
      <Pressable
        style={{
          flex: 1,
          paddingVertical: 12,
          alignItems: 'center',
          borderRadius: 6,
          flexDirection: 'row',
          justifyContent: 'center',
          backgroundColor: billingCycle === 'yearly' ? selectedBgColor : 'transparent'
        }}
        onPress={() => onChange('yearly')}
      >
        <Text 
          style={{
            color: billingCycle === 'yearly' ? accentColor : textColor,
            fontSize: 14,
            fontWeight: billingCycle === 'yearly' ? 'bold' : 'normal' as const
          }}
        >
          {t('subscription.yearly')}
        </Text>
        {yearlyDiscount && (
          <View style={{
            backgroundColor: accentColor,
            borderRadius: 12,
            paddingHorizontal: 8,
            paddingVertical: 2,
            marginLeft: 8
          }}>
            <Text style={{ color: '#000000', fontSize: 10, fontWeight: 'bold' as const }}>{t('subscription.yearly_discount', { percentage: yearlyDiscount })}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
};

export default BillingToggle;
