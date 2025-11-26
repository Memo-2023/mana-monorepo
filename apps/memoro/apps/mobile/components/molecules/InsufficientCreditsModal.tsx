import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '~/features/theme/ThemeProvider';
import Text from '~/components/atoms/Text';
import Button from '~/components/atoms/Button';
import BaseModal from '~/components/atoms/BaseModal';
import ManaIcon from '~/features/subscription/ManaIcon';
import { useTranslation } from 'react-i18next';

interface InsufficientCreditsModalProps {
  isVisible: boolean;
  onClose: () => void;
  requiredCredits?: number;
  availableCredits?: number;
  operation?: string;
}

/**
 * Modal that is displayed when a user doesn't have enough mana/credits for an operation.
 * Shows the current credit status and provides a button to navigate to the subscription page.
 */
const InsufficientCreditsModal: React.FC<InsufficientCreditsModalProps> = ({
  isVisible,
  onClose,
  requiredCredits,
  availableCredits,
  operation,
}) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const handleBuyCredits = () => {
    onClose();
    router.push('/(protected)/subscription');
  };

  const renderFooter = () => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Button
        title={t('common.cancel', 'Abbrechen')}
        onPress={onClose}
        variant='secondary'
        style={{ flex: 1, marginRight: 8 }}
      />
      <Button
        title={t('subscription.buy_credits', 'Mana kaufen')}
        onPress={handleBuyCredits}
        variant='primary'
        iconName='card-outline'
        style={{ flex: 1 }}
      />
    </View>
  );

  return (
    <BaseModal
      isVisible={isVisible}
      onClose={onClose}
      title={t('credits.insufficient_title', 'Nicht genügend Mana')}
      animationType='fade'
      closeOnOverlayPress={true}
      footerContent={renderFooter()}
    >
      <View style={{ alignItems: 'center', paddingVertical: 16 }}>
        {/* Mana Icon */}
        <View style={{ marginBottom: 16 }}>
          <ManaIcon size={64} />
        </View>
        
        {/* Main message */}
        <Text 
          style={{ 
            textAlign: 'center', 
            fontSize: 16, 
            marginBottom: 12,
            color: isDark ? '#FFFFFF' : '#000000'
          }}
        >
          {requiredCredits && availableCredits !== undefined ? 
            t('credits.insufficient_detailed', {
              required: requiredCredits,
              available: availableCredits,
              defaultValue: `Du benötigst ${requiredCredits} Mana, hast aber nur ${availableCredits} verfügbar.`
            }) : 
            t('credits.insufficient_message', 'Du hast nicht genügend Mana für diese Operation.')
          }
        </Text>
        
        {/* Secondary message */}
        <Text 
          style={{ 
            textAlign: 'center', 
            fontSize: 14, 
            opacity: 0.7,
            color: isDark ? '#FFFFFF' : '#000000'
          }}
        >
          {t('credits.insufficient_subtitle', 'Lade dein Konto auf, um fortzufahren.')}
        </Text>
        
        {/* Information about local storage */}
        <View 
          style={{ 
            backgroundColor: isDark ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.1)',
            borderRadius: 8,
            padding: 12,
            marginTop: 16,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.3)'
          }}
        >
          <Text 
            style={{ 
              textAlign: 'center', 
              fontSize: 13, 
              lineHeight: 18,
              color: isDark ? '#FFFFFF' : '#000000'
            }}
          >
            💾 {t('credits.memo_saved_locally', 'Dein Memo wurde trotzdem auf dem Gerät gespeichert und kann über das Audio-Archiv hochgeladen werden, sobald wieder Mana verfügbar ist.')}
          </Text>
        </View>
      </View>
    </BaseModal>
  );
};

export default InsufficientCreditsModal;