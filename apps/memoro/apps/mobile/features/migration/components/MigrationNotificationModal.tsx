import React from 'react';
import { View, Modal, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '~/components/atoms/Button';
import Text from '~/components/atoms/Text';
import { useTheme } from '~/features/theme/ThemeProvider';
import Icon from '~/components/atoms/Icon';
import MemoroLogo from '~/components/atoms/MemoroLogo';
import { useTranslation } from 'react-i18next';
import {
  getSubscriptionDisplayName,
  getSubscriptionTier,
  isYearlySubscription,
  getSubscriptionPrices,
} from '../utils/subscriptionPlanMapping';

interface MigrationNotificationModalProps {
  isVisible: boolean;
  onClose: () => void;
  subscriptionPlanId?: string | null;
  isActiveSubscription?: boolean;
  migrationStats?: {
    memos_count: number;
    memories_count: number;
    images_count: number;
    tags_count: number;
    migrated_at: string;
  };
}

const MigrationNotificationModal: React.FC<MigrationNotificationModalProps> = ({
  isVisible,
  onClose,
  subscriptionPlanId,
  isActiveSubscription,
  migrationStats,
}) => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  // Use actual migration stats or default values
  const stats = migrationStats
    ? {
        memoCount: migrationStats.memos_count,
        memoryCount: migrationStats.memories_count,
        imageCount: migrationStats.images_count,
        tagCount: migrationStats.tags_count,
      }
    : { memoCount: 0, memoryCount: 0, imageCount: 0, tagCount: 0 };
  const isLoading = false;
  const error = null;
  const subscriptionInfo = null;
  const { t } = useTranslation();

  // Subscription plan details with 33% bonus calculations
  const subscriptionPlans = {
    Mini: {
      price: t('migration.month_price', { price: '1€' }),
      monthlyMana: 600,
      bonusMana: 200, // 33% bonus
    },
    Plus: {
      price: t('migration.month_price', { price: '7€' }),
      monthlyMana: 1500,
      bonusMana: 500, // 33% bonus
    },
    Pro: {
      price: t('migration.month_price', { price: '23€' }),
      monthlyMana: 3000,
      bonusMana: 1000, // 33% bonus
    },
    Ultra: {
      price: t('migration.month_price', { price: '47€' }),
      monthlyMana: 5000,
      bonusMana: 1650, // 33% bonus
    },
    'Pro User': {
      price: t('migration.month_price', { price: '23€' }),
      monthlyMana: 3000,
      bonusMana: 1000,
    },
    Free: {
      price: t('migration.free_plan'),
      monthlyMana: 150,
      bonusMana: 50, // 33% bonus
    },
  };

  const currentPlanId = subscriptionPlanId || subscriptionInfo;
  const currentPlanDisplayName = getSubscriptionDisplayName(currentPlanId, isActiveSubscription);
  const currentPlanTier = getSubscriptionTier(currentPlanId, isActiveSubscription);
  const isYearly = isYearlySubscription(currentPlanId);
  const prices = getSubscriptionPrices();

  // Update plan details with correct price based on subscription type
  const planDetails = subscriptionPlans[currentPlanTier] || subscriptionPlans['Pro User'];
  const planPrice =
    currentPlanTier !== 'Pro User'
      ? isYearly
        ? t('migration.year_price', { price: prices.yearly[currentPlanTier] })
        : t('migration.month_price', { price: prices.monthly[currentPlanTier] })
      : planDetails.price;

  const features = [
    {
      id: 'mana',
      title: t('migration.mana_credits_title'),
      description: t('migration.mana_credits_desc'),
      icon: 'sparkles',
      iconColor: '#9B59B6',
    },
    {
      id: 'question',
      title: t('migration.question_memos_title'),
      description: t('migration.question_memos_desc'),
      icon: 'help-circle-outline',
      iconColor: '#3498DB',
    },
    {
      id: 'combine',
      title: t('migration.combine_memos_title'),
      description: t('migration.combine_memos_desc'),
      icon: 'git-merge-outline',
      iconColor: '#2ECC71',
    },
  ];

  return (
    <Modal animationType="fade" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: isDark ? '#1a1a1a' : '#ffffff', paddingTop: insets.top },
          ]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { paddingTop: 40 }]}>
            <View style={styles.headerContainer}>
              <MemoroLogo size={64} style={styles.logo} />
              <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                {t('migration.welcome_title')}
              </Text>
            </View>

            {/* Migration Success Section */}
            <View
              style={[
                styles.migrationSuccessCard,
                {
                  backgroundColor: isDark ? 'rgba(76, 175, 80, 0.1)' : '#E8F5E9',
                  borderColor: isDark ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.2)',
                },
              ]}>
              <View style={styles.migrationHeader}>
                <View
                  style={[
                    styles.successIconContainer,
                    {
                      backgroundColor: isDark
                        ? 'rgba(76, 175, 80, 0.2)'
                        : 'rgba(76, 175, 80, 0.15)',
                    },
                  ]}>
                  <Icon name="checkmark-circle" size={32} color="#4CAF50" />
                </View>
                <Text style={[styles.migrationTitle, { color: isDark ? '#4CAF50' : '#2E7D32' }]}>
                  {t('migration.data_transferred')}
                </Text>
              </View>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#4CAF50" />
                  <Text style={[styles.loadingText, { color: isDark ? '#A5D6A7' : '#4CAF50' }]}>
                    {t('migration.loading_stats')}
                  </Text>
                </View>
              ) : error ? (
                <Text style={[styles.errorText, { color: isDark ? '#FFCDD2' : '#D32F2F' }]}>
                  {error}
                </Text>
              ) : (
                <View style={styles.migrationList}>
                  {[
                    {
                      icon: 'document-text-outline',
                      text: t('migration.memos'),
                      count: stats.memoCount,
                      color: '#3498DB',
                    },
                    {
                      icon: 'heart-outline',
                      text: t('migration.memories'),
                      count: stats.memoryCount,
                      color: '#E91E63',
                    },
                    {
                      icon: 'image-outline',
                      text: t('migration.images'),
                      count: stats.imageCount,
                      color: '#FF9800',
                    },
                    {
                      icon: 'pricetag-outline',
                      text: t('migration.tags'),
                      count: stats.tagCount,
                      color: '#9C27B0',
                    },
                  ].map((item, index) => (
                    <View
                      key={index}
                      style={[
                        styles.migrationListItem,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(0, 0, 0, 0.03)',
                          borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                        },
                      ]}>
                      <View
                        style={[styles.itemIconContainer, { backgroundColor: item.color + '20' }]}>
                        <Icon name={item.icon} size={20} color={item.color} />
                      </View>
                      <Text
                        style={[
                          styles.migrationLabel,
                          { color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' },
                        ]}>
                        {item.text}
                      </Text>
                      <View style={styles.spacer} />
                      <Text
                        style={[styles.migrationCount, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        {item.count.toLocaleString('de-DE')}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Subscription Benefits Section */}
            {currentPlanTier !== 'Free' && (
              <View
                style={[
                  styles.subscriptionSection,
                  {
                    backgroundColor: isDark ? 'rgba(255, 215, 0, 0.1)' : '#FFFAF0',
                    borderColor: isDark ? 'rgba(255, 215, 0, 0.3)' : 'rgba(255, 215, 0, 0.2)',
                  },
                ]}>
                <View style={styles.subscriptionSectionHeader}>
                  <View
                    style={[
                      styles.subscriptionIconContainer,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 215, 0, 0.2)'
                          : 'rgba(255, 215, 0, 0.15)',
                      },
                    ]}>
                    <Icon name="star" size={24} color="#FFD700" />
                  </View>
                  <Text
                    style={[
                      styles.subscriptionSectionTitle,
                      { color: isDark ? '#FFD700' : '#FFA000' },
                    ]}>
                    {t('migration.your_plan', { plan: currentPlanDisplayName })}
                  </Text>
                  <Text
                    style={[
                      styles.subscriptionSectionPrice,
                      { color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' },
                    ]}>
                    {planPrice}
                  </Text>
                </View>

                <View style={styles.subscriptionBenefits}>
                  <View
                    style={[
                      styles.benefitCard,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.03)',
                      },
                    ]}>
                    <View style={styles.benefitIcon}>
                      <Icon name="sparkles" size={20} color="#9B59B6" />
                    </View>
                    <View style={styles.benefitContent}>
                      <Text
                        style={[styles.benefitTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                        {t('migration.monthly_mana')}
                      </Text>
                      <View style={styles.benefitValueRow}>
                        <Text
                          style={[
                            styles.benefitMainValue,
                            { color: isDark ? '#FFFFFF' : '#000000' },
                          ]}>
                          {planDetails.monthlyMana.toLocaleString('de-DE')}
                        </Text>
                        <Text style={styles.benefitBonus}>
                          +{planDetails.bonusMana.toLocaleString('de-DE')}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={styles.bonusNoteContainer}>
                  <Text style={styles.bonusIcon}>🎁</Text>
                  <Text style={[styles.bonusNote, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                    {t('migration.loyalty_bonus_simple')}
                  </Text>
                </View>
              </View>
            )}

            {/* Free Plan Section */}
            {currentPlanTier === 'Free' && (
              <View
                style={[
                  styles.subscriptionSection,
                  {
                    backgroundColor: isDark ? 'rgba(96, 125, 139, 0.1)' : '#ECEFF1',
                    borderColor: isDark ? 'rgba(96, 125, 139, 0.3)' : 'rgba(96, 125, 139, 0.2)',
                  },
                ]}>
                <View style={styles.subscriptionSectionHeader}>
                  <View
                    style={[
                      styles.subscriptionIconContainer,
                      {
                        backgroundColor: isDark
                          ? 'rgba(96, 125, 139, 0.2)'
                          : 'rgba(96, 125, 139, 0.15)',
                      },
                    ]}>
                    <Icon name="gift-outline" size={24} color="#607D8B" />
                  </View>
                  <Text
                    style={[
                      styles.subscriptionSectionTitle,
                      { color: isDark ? '#90A4AE' : '#546E7A' },
                    ]}>
                    {currentPlanDisplayName}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.freeplanMessage,
                    { color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' },
                  ]}>
                  {t('migration.free_plan_message')}
                </Text>
              </View>
            )}

            {/* New Features Section */}
            <View
              style={[
                styles.featuresSection,
                {
                  backgroundColor: isDark ? 'rgba(155, 89, 182, 0.1)' : '#F3E5F5',
                  borderColor: isDark ? 'rgba(155, 89, 182, 0.3)' : 'rgba(155, 89, 182, 0.2)',
                },
              ]}>
              <View style={styles.featuresSectionHeader}>
                <View
                  style={[
                    styles.featuresIconContainer,
                    {
                      backgroundColor: isDark
                        ? 'rgba(155, 89, 182, 0.2)'
                        : 'rgba(155, 89, 182, 0.15)',
                    },
                  ]}>
                  <Icon name="rocket" size={24} color="#9B59B6" />
                </View>
                <Text
                  style={[styles.featuresSectionTitle, { color: isDark ? '#CE93D8' : '#7B1FA2' }]}>
                  {t('migration.new_features_title')}
                </Text>
              </View>

              <View style={styles.featuresItems}>
                {features.map((feature) => (
                  <View key={feature.id} style={styles.featureItem}>
                    <View style={{ marginRight: 24 }}>
                      <Icon name={feature.icon} size={20} color={feature.iconColor} />
                    </View>
                    <View style={styles.featureItemContent}>
                      <Text
                        style={[
                          styles.featureItemTitle,
                          { color: isDark ? '#FFFFFF' : '#000000' },
                        ]}>
                        {feature.title}
                      </Text>
                      <Text
                        style={[
                          styles.featureItemDescription,
                          { color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' },
                        ]}>
                        {feature.description}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* Privacy Section */}
            <View
              style={[
                styles.privacySection,
                {
                  backgroundColor: isDark ? 'rgba(33, 150, 243, 0.1)' : '#E3F2FD',
                  borderColor: isDark ? 'rgba(33, 150, 243, 0.3)' : 'rgba(33, 150, 243, 0.2)',
                },
              ]}>
              <View style={styles.privacySectionHeader}>
                <View
                  style={[
                    styles.privacyIconContainer,
                    {
                      backgroundColor: isDark
                        ? 'rgba(33, 150, 243, 0.2)'
                        : 'rgba(33, 150, 243, 0.15)',
                    },
                  ]}>
                  <Icon name="shield-checkmark" size={24} color="#2196F3" />
                </View>
                <Text style={[styles.privacyTitle, { color: isDark ? '#2196F3' : '#1565C0' }]}>
                  {t('migration.privacy_improved')}
                </Text>
              </View>
              <View style={styles.privacyItems}>
                <View style={styles.privacyItem}>
                  <View style={{ marginRight: 24 }}>
                    <Icon name="close-circle" size={20} color="#F44336" />
                  </View>
                  <View style={styles.privacyItemContent}>
                    <Text
                      style={[styles.privacyItemTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                      {t('migration.no_google_analytics')}
                    </Text>
                    <Text
                      style={[
                        styles.privacyItemDescription,
                        { color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' },
                      ]}>
                      {t('migration.no_google_analytics_desc')}
                    </Text>
                  </View>
                </View>
                <View style={styles.privacyItem}>
                  <View style={{ marginRight: 24 }}>
                    <Icon name="analytics" size={20} color="#4CAF50" />
                  </View>
                  <View style={styles.privacyItemContent}>
                    <Text
                      style={[styles.privacyItemTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                      {t('migration.opensource_analytics')}
                    </Text>
                    <Text
                      style={[
                        styles.privacyItemDescription,
                        { color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' },
                      ]}>
                      {t('migration.opensource_analytics_desc')}
                    </Text>
                  </View>
                </View>
                <View style={styles.privacyItem}>
                  <View style={{ marginRight: 24 }}>
                    <Icon name="server" size={20} color="#2196F3" />
                  </View>
                  <View style={styles.privacyItemContent}>
                    <Text
                      style={[styles.privacyItemTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                      {t('migration.opensource_database')}
                    </Text>
                    <Text
                      style={[
                        styles.privacyItemDescription,
                        { color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' },
                      ]}>
                      {t('migration.opensource_database_desc')}
                    </Text>
                  </View>
                </View>
                <View style={styles.privacyItem}>
                  <View style={{ marginRight: 24 }}>
                    <Icon name="location" size={20} color="#9C27B0" />
                  </View>
                  <View style={styles.privacyItemContent}>
                    <Text
                      style={[styles.privacyItemTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                      {t('migration.data_stays_eu')}
                    </Text>
                    <Text
                      style={[
                        styles.privacyItemDescription,
                        { color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' },
                      ]}>
                      {t('migration.data_stays_eu_desc')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
          <View style={[styles.buttonContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <Button
              title={t('migration.continue_button')}
              variant="primary"
              onPress={onClose}
              style={styles.continueButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 36,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  migrationSuccessCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  migrationHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  migrationTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  migrationSubtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  migrationList: {
    gap: 8,
  },
  migrationListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  itemIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  migrationCount: {
    fontSize: 18,
    fontWeight: '600',
  },
  migrationLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  spacer: {
    flex: 1,
  },
  subscriptionSection: {
    borderRadius: 20,
    padding: 20,
    marginTop: 0,
    marginBottom: 20,
    borderWidth: 1,
  },
  subscriptionSectionHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  subscriptionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  subscriptionSectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  subscriptionSectionPrice: {
    fontSize: 16,
  },
  subscriptionBenefits: {
    gap: 8,
    marginBottom: 16,
  },
  benefitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  benefitIcon: {
    marginRight: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  benefitValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  benefitMainValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  benefitBonus: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
  },
  benefitUnit: {
    fontSize: 13,
    marginLeft: 4,
  },
  bonusNoteContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  bonusIcon: {
    fontSize: 24,
    marginBottom: 8,
    lineHeight: 30,
  },
  bonusNote: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 10,
  },
  featuresSection: {
    borderRadius: 20,
    padding: 20,
    marginTop: 0,
    marginBottom: 20,
    borderWidth: 1,
  },
  featuresSectionHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  featuresIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featuresSectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  featuresItems: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureItemContent: {
    flex: 1,
  },
  featureItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureItemDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  continueButton: {
    height: 56,
  },
  privacySection: {
    borderRadius: 20,
    padding: 20,
    marginTop: 0,
    marginBottom: 20,
    borderWidth: 1,
  },
  privacySectionHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  privacyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  privacyTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  privacyItems: {
    gap: 16,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  privacyItemIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  privacyItemContent: {
    flex: 1,
  },
  privacyItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  privacyItemDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  freeplanMessage: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    paddingTop: 12,
  },
});

export default MigrationNotificationModal;
