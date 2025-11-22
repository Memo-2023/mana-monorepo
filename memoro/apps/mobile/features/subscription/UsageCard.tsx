import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useCredits } from '~/features/credits/CreditContext';
import { useTranslation } from 'react-i18next';
import colors from '~/tailwind.config.js';

export interface UsageDataProps {
  total: number;
  lastWeek: number;
  lastMonth: number;
  currentMana: number;
  maxMana: number;
  history?: Array<{
    date: string;
    amount: number;
  }>;
}

interface UsageCardProps {
  title?: string;
  usageData: UsageDataProps;
  currentPlan?: string;
}

export const UsageCard: React.FC<UsageCardProps> = ({ title, usageData, currentPlan }) => {
  const { isDark, themeVariant, tw } = useTheme();
  const { credits: contextCredits, isLoading: contextLoading } = useCredits();
  const { t } = useTranslation();

  // Use real credits from context instead of static data
  const currentMana = contextCredits ?? usageData.currentMana;

  // Berechnung für verfügbare vs. verbrauchte Mana
  const usedMana = usageData.maxMana - currentMana;
  
  // On subscription page, always show full numbers regardless of settings
  const formattedCurrentMana = currentMana.toString();
  const formattedUsedMana = usedMana.toString();
  const usedPercentage = Math.min(100, Math.round((usedMana / usageData.maxMana) * 100));
  const calculatedPercentage = Math.round((currentMana / usageData.maxMana) * 100);
  // Mindestens 1% für Zahlen bis 5, damit immer ein kleiner blauer Balken sichtbar ist
  const availablePercentage =
    currentMana <= 5 && currentMana > 0 ? Math.max(1, calculatedPercentage) : calculatedPercentage;
  const availableMana = currentMana;

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
  const progressBgColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  return (
    <View
      style={{
        backgroundColor: bgColor,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: borderColor,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.1,
        shadowRadius: 8,
        elevation: 4,
      }}>
      {/* Mana-Fortschrittsbalken */}
      <View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 16,
          }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: textColor, fontSize: 20, fontWeight: '700' }}>
              {t('subscription.your_mana', 'Dein Mana')}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={{
              backgroundColor: isDark ? 'rgba(66, 135, 245, 0.15)' : 'rgba(66, 135, 245, 0.1)',
              paddingHorizontal: 16,
              paddingVertical: 6,
              borderRadius: 12,
              alignSelf: 'flex-start',
            }}>
              <Text
                style={{
                  color: textColor,
                  fontSize: 20,
                  fontWeight: 'bold',
                }}>
                {contextLoading ? '...' : formattedCurrentMana}
              </Text>
            </View>
          </View>
        </View>

        {/* Coolerer Fortschrittsbalken */}
        <View
          style={{
            height: 16,
            backgroundColor: progressBgColor,
            borderRadius: 8,
            overflow: 'hidden',
            position: 'relative',
            marginBottom: 8,
          }}>
          <View
            style={{
              height: '100%',
              width: `${availablePercentage}%`,
              background: `linear-gradient(90deg, ${accentColor} 0%, #66B2FF 100%)`,
              backgroundColor: accentColor, // Fallback for React Native
              borderRadius: 8,
              shadowColor: accentColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 4,
            }}
          />
        </View>

        {/* Prozentwert */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: secondaryTextColor, fontSize: 13, fontWeight: '500' }}>
            {t('subscription.percentage_available', '{{percentage}}% available', {
              percentage: availablePercentage,
            })}
          </Text>
          <Text style={{ color: secondaryTextColor, fontSize: 13, fontWeight: '500' }}>
            {t('subscription.mana_used', '{{amount}} used', { amount: formattedUsedMana })}
          </Text>
        </View>
        
        {/* Aktueller Plan */}
        {currentPlan && (
          <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: borderColor }}>
            <Text style={{ color: secondaryTextColor, fontSize: 14, fontWeight: '500', textAlign: 'center' }}>
              {t('subscription.current_plan', 'Current Plan')}: {currentPlan}
            </Text>
          </View>
        )}
      </View>

      {/* Nutzungsstatistiken - Vorerst auskommentiert (statische Demo-Daten) */}
      {/* <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons name="today-outline" size={14} color={secondaryTextColor} />
            <Text style={{ color: secondaryTextColor, fontSize: 12, marginLeft: 4 }}>Heute</Text>
          </View>
          <Text style={{ color: textColor, fontSize: 16, fontWeight: 'bold' as const }}>{usageData.total} Mana</Text>
        </View>
        
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons name="time-outline" size={14} color={secondaryTextColor} />
            <Text style={{ color: secondaryTextColor, fontSize: 12, marginLeft: 4 }}>7 Tage</Text>
          </View>
          <Text style={{ color: textColor, fontSize: 16, fontWeight: 'bold' as const }}>{usageData.lastWeek} Mana</Text>
        </View>
        
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons name="calendar-outline" size={14} color={secondaryTextColor} />
            <Text style={{ color: secondaryTextColor, fontSize: 12, marginLeft: 4 }}>30 Tage</Text>
          </View>
          <Text style={{ color: textColor, fontSize: 16, fontWeight: 'bold' as const }}>{usageData.lastMonth} Mana</Text>
        </View>
      </View> */}
    </View>
  );
};

export default UsageCard;
