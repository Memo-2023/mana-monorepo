import React, { useMemo } from 'react';
import { View, Dimensions } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import Text from './atoms/Text';
import { useTranslation } from 'react-i18next';
import { LogoSpinnerAnimation } from './molecules/LogoSpinnerAnimation';

/**
 * Einfacher Ladebildschirm für die App
 * @param {Object} props - Komponenten-Props
 * @param {string} [props.message] - Optionale Nachricht, die angezeigt werden soll
 */
interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message }: LoadingScreenProps) {
  const { isDark } = useTheme();

  // Safe translation usage with fallback
  let displayMessage = message;
  try {
    // Only try to use translation if no explicit message is provided
    if (!displayMessage) {
      const { t } = useTranslation();
      displayMessage = t('common.loading', 'Wird geladen...');
    }
  } catch (error) {
    // Fallback if translation fails
    displayMessage = displayMessage || 'Wird geladen...';
  }

  // Use same responsive sizing logic as recording button
  const logoSize = useMemo(() => {
    const { width, height } = Dimensions.get('window');
    const minDimension = Math.min(width, height);

    if (minDimension <= 375) {
      return 140; // iPhone SE, 13 mini
    } else if (minDimension <= 390) {
      return 150; // iPhone 13/14/15
    } else if (minDimension <= 393) {
      return 155; // iPhone 14 Pro, 16
    } else if (minDimension <= 402) {
      return 160; // iPhone 16 Pro
    } else if (minDimension <= 428) {
      return 170; // iPhone 13/14 Pro Max
    } else if (minDimension <= 430) {
      return 180; // iPhone 15/16 Pro Max
    } else {
      return 200; // iPad & Tablets
    }
  }, []);

  return (
    <View style={{
      flex: 1,
      position: 'relative',
      backgroundColor: isDark ? '#121212' : '#FFFFFF'
    }}>
      {/* Logo and text positioned exactly like recording button */}
      <View style={{
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        transform: [{ translateY: -(logoSize / 2 + 10) }]
      }}>
        <LogoSpinnerAnimation size={logoSize} />
        <Text variant='h3' style={{ marginTop: 32, fontWeight: '600' }}>
          {displayMessage}
        </Text>
      </View>
    </View>
  );
}
