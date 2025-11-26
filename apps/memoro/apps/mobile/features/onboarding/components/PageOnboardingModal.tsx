import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from '~/components/atoms/Text';
import BaseModal from '~/components/atoms/BaseModal';
import { useTheme } from '~/features/theme/ThemeProvider';
import Icon from '~/components/atoms/Icon';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface PageOnboardingModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  features: Feature[];
  actionLabel: string;
}

/**
 * Page-specific onboarding modal that explains features of a page
 */
const PageOnboardingModal = ({
  visible,
  onClose,
  title,
  message,
  features,
  actionLabel,
}: PageOnboardingModalProps): React.ReactElement => {
  const { colors } = useTheme();

  return (
    <BaseModal
      isVisible={visible}
      onClose={onClose}
      title={title}
      animationType="fade"
      size="medium"
      primaryButtonText={actionLabel}
      onPrimaryButtonPress={onClose}
      scrollable={true}
    >
      <View style={styles.contentContainer}>
        {message && (
          <Text style={styles.message}>
            {message}
          </Text>
        )}

        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View
              key={index}
              style={[
                styles.featureCard,
                {
                  backgroundColor: colors.contentBackgroundHover,
                  borderColor: colors.border,
                }
              ]}
            >
              <View style={styles.featureItem}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: `${colors.primaryButton}20` }
                  ]}
                >
                  <Icon name={feature.icon} size={24} color={colors.text} />
                </View>
                <View style={styles.featureTextContainer}>
                  <Text variant="h3" style={styles.featureTitle}>
                    {feature.title}
                  </Text>
                  <Text variant="caption">
                    {feature.description}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    width: '100%',
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  featuresContainer: {
    gap: 12,
  },
  featureCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    marginBottom: 4,
  },
  featureDescription: {
    // Keine fontSize/lineHeight, damit variant="caption" diese steuert
  },
});

export default PageOnboardingModal;
