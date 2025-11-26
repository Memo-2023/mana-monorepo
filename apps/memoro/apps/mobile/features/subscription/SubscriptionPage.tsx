import React, { useState, useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import Button from '~/components/atoms/Button';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeProvider';
import SubscriptionCard, { SubscriptionPlanProps } from './SubscriptionCard';
import PackageCard, { PackageProps } from './PackageCard';
import BillingToggle, { BillingCycle } from './BillingToggle';
import CostCard from './CostCard';
import UsageCard from './UsageCard';
import SubscriptionPageSkeleton from './SubscriptionPageSkeleton';
import subscriptionData from './subscriptionData.json';
import appCostsData from './appCosts.json';
import usageData from './usageData.json';

// Import subscription service
import {
  initializeRevenueCat,
  purchaseSubscription,
  purchaseManaPackage,
  hasActiveSubscription,
} from './subscriptionService';
import { multiPlatformAnalytics } from '~/features/analytics/services/multiPlatformAnalytics';
import {
  RevenueCatSubscriptionPlan,
} from './subscriptionTypes';
import { useSubscriptionData } from './useSubscriptionData';
import colors from '~/tailwind.config.js';
import { useTranslation } from 'react-i18next';
import { userSettingsService } from '../settings/services/userSettingsService';
import { useCredits } from '../credits/CreditContext';

// Verwenden der Daten aus den JSON-Dateien
const subscriptionOptions: SubscriptionPlanProps[] =
  subscriptionData.subscriptions as SubscriptionPlanProps[];
const manaPackages: PackageProps[] = subscriptionData.packages as PackageProps[];
const legacySubscriptions: SubscriptionPlanProps[] = (subscriptionData as any)
  .legacySubscriptions as SubscriptionPlanProps[];

// Kosten für verschiedene Aktionen in der App aus der JSON-Datei laden
const appCosts: any[] = appCostsData.costs as any[];

// Nutzungsdaten aus der JSON-Datei laden
const usage: any = usageData.usage as any;

interface SubscriptionPageProps {
  onSubscribe?: (planId: string, billingCycle: BillingCycle) => void;
  onBuyPackage?: (packageId: string) => void;
}

const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ onSubscribe, onBuyPackage }) => {
  const router = useRouter();
  const { isDark, themeVariant, tw } = useTheme();
  const { t } = useTranslation();
  const { refreshCredits } = useCredits();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  // State für den ausgewählten Abonnementtyp
  const [selectedSubscriptionType, setSelectedSubscriptionType] = useState<
    'individual' | 'team' | 'enterprise'
  >('individual');

  // Subscription data from RevenueCat or fallback using custom hook
  const {
    data: subscriptionServiceData,
    isLoading: isLoadingData,
    error: dataError,
  } = useSubscriptionData();
  const [activeSubscription, setActiveSubscription] = useState<RevenueCatSubscriptionPlan | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentUserPlanId, setCurrentUserPlanId] = useState<string | null>(null);
  const [currentUserLegacyPlanId, setCurrentUserLegacyPlanId] = useState<string | null>(null);
  const [userLegacySubscription, setUserLegacySubscription] =
    useState<SubscriptionPlanProps | null>(null);

  // State für das Sticky-Verhalten des BillingToggle
  const [isBillingToggleSticky, setIsBillingToggleSticky] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // State für das Anzeigen von größeren Abos und Paketen
  const [showLargerPlans, setShowLargerPlans] = useState(false);
  const [showLargerPackages, setShowLargerPackages] = useState(false);
  const [showLargerTeamPlans, setShowLargerTeamPlans] = useState(false);
  const [showLargerTeamPackages, setShowLargerTeamPackages] = useState(false);
  const [showLargerEnterprisePlans, setShowLargerEnterprisePlans] = useState(false);
  const [showLargerEnterprisePackages, setShowLargerEnterprisePackages] = useState(false);

  // Filtere die kleineren Pakete (Mana Flasche und Mana Fass)
  const getSmallerManaPackages = () => {
    return manaPackages.filter(
      (pkg) =>
        !pkg.isTeamPackage &&
        !pkg.isEnterprisePackage &&
        (pkg.id === 'Mana_Potion_Small_v1' || pkg.id === 'Mana_Potion_Medium_v1')
    );
  };

  // Filtere die größeren Pakete (Mana Tank und Mana Reservoir)
  const getLargerManaPackages = () => {
    return manaPackages.filter(
      (pkg) =>
        !pkg.isTeamPackage &&
        !pkg.isEnterprisePackage &&
        (pkg.id === 'Mana_Potion_Large_v1' || pkg.id === 'Mana_Potion_Giant_v2')
    );
  };

  // Filtere die kleineren Team-Abos
  const getSmallerTeamPlans = () => {
    const teamPlans = subscriptionOptions.filter(
      (plan) => plan.id !== 'free' && plan.billingCycle === billingCycle && plan.isTeamSubscription
    );

    // Zeige nur die ersten zwei Team-Abos
    return teamPlans.slice(0, 2);
  };

  // Filtere die größeren Team-Abos
  const getLargerTeamPlans = () => {
    const teamPlans = subscriptionOptions.filter(
      (plan) => plan.id !== 'free' && plan.billingCycle === billingCycle && plan.isTeamSubscription
    );

    // Zeige die restlichen Team-Abos (ab dem dritten)
    return teamPlans.slice(2);
  };

  // Filtere die kleineren Team-Pakete
  const getSmallerTeamPackages = () => {
    const teamPackages = manaPackages.filter((pkg) => pkg.isTeamPackage);
    // Zeige nur die ersten zwei Team-Pakete
    return teamPackages.slice(0, 2);
  };

  // Filtere die größeren Team-Pakete
  const getLargerTeamPackages = () => {
    const teamPackages = manaPackages.filter((pkg) => pkg.isTeamPackage);
    // Zeige die restlichen Team-Pakete (ab dem dritten)
    return teamPackages.slice(2);
  };

  // Filtere die kleineren Enterprise-Abos
  const getSmallerEnterprisePlans = () => {
    const enterprisePlans = subscriptionOptions.filter(
      (plan) =>
        plan.id !== 'free' && plan.billingCycle === billingCycle && plan.isEnterpriseSubscription
    );

    // Zeige nur die ersten zwei Enterprise-Abos
    return enterprisePlans.slice(0, 2);
  };

  // Filtere die größeren Enterprise-Abos
  const getLargerEnterprisePlans = () => {
    const enterprisePlans = subscriptionOptions.filter(
      (plan) =>
        plan.id !== 'free' && plan.billingCycle === billingCycle && plan.isEnterpriseSubscription
    );

    // Zeige die restlichen Enterprise-Abos (ab dem dritten)
    return enterprisePlans.slice(2);
  };

  // Filtere die kleineren Enterprise-Pakete
  const getSmallerEnterprisePackages = () => {
    const enterprisePackages = manaPackages.filter((pkg) => pkg.isEnterprisePackage);
    // Zeige nur die ersten zwei Enterprise-Pakete
    return enterprisePackages.slice(0, 2);
  };

  // Filtere die größeren Enterprise-Pakete
  const getLargerEnterprisePackages = () => {
    const enterprisePackages = manaPackages.filter((pkg) => pkg.isEnterprisePackage);
    // Zeige die restlichen Enterprise-Pakete (ab dem dritten)
    return enterprisePackages.slice(2);
  };

  // Animation für das Einfahren von oben
  const slideAnimation = useRef(new Animated.Value(-100)).current;

  // Check if a plan ID is a legacy subscription
  const isLegacyPlanId = (planId: string): boolean => {
    const legacyIds = [
      'Mini_1m_v1',
      'Plus_7E_1m_v1',
      'Pro_23E_1m_v1',
      'Ultra_47E_1m_v1',
      'Mini_1y_v1',
      'Plus_70E_1y_v1',
      'Pro_230E_1y_v1',
      'Ultra_470E_1y_v1',
      'rc_plus_monthly_8e_play:plus-monthly-8e-autorenewing',
      'rc_pro_monthly_23e_play:rc-pro-monthly-8e-play-renewel',
      'rc_ultra_monthly_play:rc-ultra-monthly-play',
      'rc_plus_yearly_80e_play:rc-plus-yearly-80e-play-renewel',
      'rc_pro_yearly_229e_play:rc-pro-yearly-229e-play-renewel',
      'rc_ultra_yearly_play:rc-ultra-yearly-play',
    ];
    return legacyIds.includes(planId);
  };

  // Map database subscription plan ID to the plan IDs used in subscription data
  const mapDatabasePlanIdToUIPlanId = (dbPlanId: string | null): string | null => {
    if (!dbPlanId) return null;

    // Map from database IDs to UI IDs
    const mapping: Record<string, string> = {
      // Legacy monthly plans - iOS
      Mini_1m_v1: 'Mana_Stream_Small_v1',
      Plus_7E_1m_v1: 'Mana_Stream_Medium_v1',
      Pro_23E_1m_v1: 'Mana_Stream_Large_v1',
      Ultra_47E_1m_v1: 'Mana_Stream_Giant_v1',

      // Legacy monthly plans - Android (old naming)
      'rc_plus_monthly_8e_play:plus-monthly-8e-autorenewing': 'Mana_Stream_Medium_v1',
      'rc_pro_monthly_23e_play:rc-pro-monthly-8e-play-renewel': 'Mana_Stream_Large_v1',
      'rc_ultra_monthly_play:rc-ultra-monthly-play': 'Mana_Stream_Giant_v1',

      // Legacy yearly plans - iOS
      Mini_1y_v1: 'Mana_Stream_Small_Yearly_v1',
      Plus_70E_1y_v1: 'Mana_Stream_Medium_Yearly_v1',
      Pro_230E_1y_v1: 'Mana_Stream_Large_Yearly_v1',
      Ultra_470E_1y_v1: 'Mana_Stream_Giant_Yearly_v1',

      // Legacy yearly plans - Android (old naming)
      'rc_plus_yearly_80e_play:rc-plus-yearly-80e-play-renewel': 'Mana_Stream_Medium_Yearly_v1',
      'rc_pro_yearly_229e_play:rc-pro-yearly-229e-play-renewel': 'Mana_Stream_Large_Yearly_v1',
      'rc_ultra_yearly_play:rc-ultra-yearly-play': 'Mana_Stream_Giant_Yearly_v1',

      // New Android product IDs (from RevenueCat dashboard)
      'mana_stream_small_v1:monthly': 'Mana_Stream_Small_v1',
      'mana_stream_small_v1:yearly': 'Mana_Stream_Small_Yearly_v1',
      'mana_stream_medium_v1:monthly': 'Mana_Stream_Medium_v1',
      'mana_stream_medium_v1:yearly': 'Mana_Stream_Medium_Yearly_v1',
      'mana_stream_large_v1:monthly': 'Mana_Stream_Large_v1',
      'mana_stream_large_v1:yearly': 'Mana_Stream_Large_Yearly_v1',
      'mana_stream_giant_v1:monthly': 'Mana_Stream_Giant_v1',
      'mana_stream_giant_v1:yearly': 'Mana_Stream_Giant_Yearly_v1',

      // New RevenueCat product IDs (direct mapping)
      Mana_Stream_Small_v1: 'Mana_Stream_Small_v1',
      Mana_Stream_Medium_v1: 'Mana_Stream_Medium_v1',
      Mana_Stream_Large_v1: 'Mana_Stream_Large_v1',
      Mana_Stream_Giant_v1: 'Mana_Stream_Giant_v1',
      Mana_Stream_Small_Yearly_v1: 'Mana_Stream_Small_Yearly_v1',
      Mana_Stream_Medium_Yearly_v1: 'Mana_Stream_Medium_Yearly_v1',
      Mana_Stream_Large_Yearly_v1: 'Mana_Stream_Large_Yearly_v1',
      Mana_Stream_Giant_Yearly_v1: 'Mana_Stream_Giant_Yearly_v1',

      // Free plan
      free: 'free',
    };

    return mapping[dbPlanId] || null;
  };

  // Fetch user's current subscription plan ID
  useEffect(() => {
    let isMounted = true;

    const fetchUserSettings = async () => {
      try {
        const response = await userSettingsService.getAllSettings();
        // Check both locations where subscription_plan_id might be
        const subscriptionPlanId =
          response?.subscription_plan_id ||
          response?.settings?.memoro?.migration?.subscription_plan_id ||
          response?.settings?.subscription_plan_id;
        if (subscriptionPlanId && isMounted) {
          // Check if it's a legacy subscription
          if (isLegacyPlanId(subscriptionPlanId)) {
            setCurrentUserLegacyPlanId(subscriptionPlanId);
            // Find the legacy subscription in our data
            const legacySub = legacySubscriptions.find((sub) => sub.id === subscriptionPlanId);
            if (legacySub) {
              setUserLegacySubscription(legacySub);
            }
            // Also set the mapped plan ID for reference
            const mappedPlanId = mapDatabasePlanIdToUIPlanId(subscriptionPlanId);
            setCurrentUserPlanId(mappedPlanId || subscriptionPlanId);
          } else {
            const mappedPlanId = mapDatabasePlanIdToUIPlanId(subscriptionPlanId);
            setCurrentUserPlanId(mappedPlanId || subscriptionPlanId);
          }
        }
      } catch (error) {
        console.debug('Error fetching user settings:', error);
      }
    };

    fetchUserSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize RevenueCat and set active subscription when data loads
  useEffect(() => {
    const initPurchases = async () => {
      try {
        // Initialize RevenueCat
        await initializeRevenueCat();

        if (subscriptionServiceData) {
          // Set initial active subscription (free tier)
          const freePlan = subscriptionServiceData.subscriptions.find((plan) => plan.id === 'free');
          if (freePlan) {
            setActiveSubscription(freePlan);
          }

          // Check if user has active subscription
          const hasSubscription = await hasActiveSubscription();
          if (hasSubscription) {
            // Find the appropriate subscription plan
            // This is a simplified example - in a real app, you'd map the entitlement to the correct plan
            const premiumPlan = subscriptionServiceData.subscriptions.find(
              (plan) => plan.id === 'Mana_Stream_Medium_v1'
            );
            if (premiumPlan) {
              setActiveSubscription(premiumPlan);
            }
          }
        }
      } catch (error) {
        console.debug('Error initializing purchases:', error);
      }
    };

    if (subscriptionServiceData && !isLoadingData) {
      initPurchases();
    }
  }, [subscriptionServiceData, isLoadingData]);

  // Die Funktion zum Wiederherstellen von Käufen wurde in die subscription.tsx-Datei verschoben

  const handleSubscribe = async (planId: string) => {
    try {
      setIsLoading(true);
      
      // Track subscription purchase attempt
      const plan = subscriptionOptions.find((p) => p.id === planId);
      multiPlatformAnalytics.track('subscription_purchase_attempted', {
        plan_id: planId,
        plan_type: plan?.type,
        billing_cycle: billingCycle,
        credits: plan?.credits,
        price: plan?.price
      });

      if (onSubscribe) {
        onSubscribe(planId, billingCycle);
      } else {
        // Use RevenueCat to purchase subscription
        await purchaseSubscription(planId, billingCycle);

        // Update the active subscription and current plan ID
        const plan = subscriptionOptions.find((p) => p.id === planId);
        if (plan) {
          setActiveSubscription(plan);
          setCurrentUserPlanId(planId);
          
          // Track successful purchase
          multiPlatformAnalytics.track('subscription_purchased', {
            plan_id: planId,
            plan_type: plan.type,
            billing_cycle: billingCycle,
            credits: plan.credits,
            price: plan.price
          });
        }

        Alert.alert(
          t('subscription.subscribe_success_title', 'Successfully Subscribed!'),
          t(
            'subscription.subscribe_success_message',
            'You have successfully subscribed to the {{planName}} plan.',
            { planName: subscriptionOptions.find((p) => p.id === planId)?.name }
          ),
          [{ text: t('common.ok', 'OK'), onPress: () => router.back() }]
        );

        // Refresh credits after 3 seconds
        setTimeout(() => {
          refreshCredits();
        }, 3000);
      }
    } catch (error: any) {
      console.error('[SubscriptionPage] Error purchasing subscription:', error);
      console.error('[SubscriptionPage] Error details:', {
        message: error.message,
        code: error.code,
        platform: Platform.OS,
        planId,
        billingCycle,
      });

      // Handle user cancellation differently
      if (error.userCancelled) {
        console.log('[SubscriptionPage] User cancelled the purchase');
        // User cancelled the purchase - no need to show an error
        return;
      }

      // Provide more specific error messages based on error type
      let errorMessage = t(
        'subscription.subscribe_error_message',
        'An error occurred while completing the subscription. Please try again later.'
      );

      if (error.message?.includes('Product not found')) {
        errorMessage =
          Platform.OS === 'android'
            ? t(
                'subscription.product_not_configured_android',
                'This subscription is not available yet. Please try again later or contact support.'
              )
            : t(
                'subscription.product_not_configured_ios',
                'This subscription is not available. Please try again later or contact support.'
              );
      } else if (error.code === 'PURCHASE_INVALID' || error.code === '2') {
        errorMessage = t(
          'subscription.purchase_invalid',
          'Unable to complete purchase. Please check your payment method and try again.'
        );
      } else if (error.code === 'PRODUCT_ALREADY_PURCHASED' || error.code === '7') {
        errorMessage = t(
          'subscription.already_subscribed',
          'You already have an active subscription. Please restore your purchases.'
        );
      } else if (error.code === 'NETWORK_ERROR' || error.code === '1') {
        errorMessage = t(
          'subscription.network_error',
          'Network error. Please check your connection and try again.'
        );
      }

      Alert.alert(t('subscription.subscribe_error_title', 'Subscription Error'), errorMessage, [
        { text: t('common.ok', 'OK') },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyPackage = async (packageId: string) => {
    try {
      setIsLoading(true);

      if (onBuyPackage) {
        onBuyPackage(packageId);
      } else {
        // Use RevenueCat to purchase package
        await purchaseManaPackage(packageId);

        const selectedPkg = manaPackages.find((p) => p.id === packageId);
        Alert.alert(
          t('subscription.purchase_success_title', 'Successfully Purchased!'),
          t(
            'subscription.purchase_success_message',
            'You have successfully purchased the {{packageName}} package with {{manaAmount}} Mana.',
            { packageName: selectedPkg?.name, manaAmount: selectedPkg?.manaAmount }
          ),
          [{ text: t('common.ok', 'OK'), onPress: () => router.back() }]
        );

        // Refresh credits after 3 seconds
        setTimeout(() => {
          refreshCredits();
        }, 3000);
      }
    } catch (error: any) {
      console.debug('Error purchasing package:', error);

      // Handle user cancellation differently
      if (error.userCancelled) {
        // User cancelled the purchase - no need to show an error
        return;
      }

      Alert.alert(
        t('subscription.purchase_error_title', 'Purchase Error'),
        t(
          'subscription.purchase_error_message',
          'An error occurred while purchasing the package. Please try again later.'
        ),
        [{ text: t('common.ok', 'OK') }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Aktualisiere die Abonnement-Optionen basierend auf dem Abrechnungszyklus und Kategorie
  const getSubscriptionPlans = (
    category?: 'individual' | 'team' | 'enterprise',
    onlySmaller?: boolean
  ) => {
    // Filtere das kostenlose Abonnement heraus, da es bereits im Aktiv-Bereich angezeigt wird
    // Filtere auch nach dem ausgewählten Abrechnungszyklus
    let paidPlans = subscriptionOptions.filter(
      (plan) => plan.id !== 'free' && plan.billingCycle === billingCycle
    );

    // Filtere nach Kategorie, wenn angegeben
    if (category === 'individual') {
      paidPlans = paidPlans.filter(
        (plan) => !plan.isTeamSubscription && !plan.isEnterpriseSubscription
      );

      // Filtere nach Größe, wenn angegeben (nur für individual)
      if (onlySmaller) {
        // Zeige nur die ersten zwei Abos (Small, Medium)
        paidPlans = paidPlans.filter(
          (plan) =>
            plan.id === 'Mana_Stream_Small_v1' ||
            plan.id === 'Mana_Stream_Small_Yearly_v1' ||
            plan.id === 'Mana_Stream_Medium_v1' ||
            plan.id === 'Mana_Stream_Medium_Yearly_v1'
        );
      }
    } else if (category === 'team') {
      paidPlans = paidPlans.filter((plan) => plan.isTeamSubscription);
    } else if (category === 'enterprise') {
      paidPlans = paidPlans.filter((plan) => plan.isEnterpriseSubscription);
    }

    return paidPlans;
  };

  // Filtere die größeren Abos heraus (Mana See und Mana Meer)
  const getLargerPlans = () => {
    const largerPlans = subscriptionOptions.filter(
      (plan) =>
        plan.id !== 'free' &&
        plan.billingCycle === billingCycle &&
        !plan.isTeamSubscription &&
        !plan.isEnterpriseSubscription &&
        (plan.id === 'Mana_Stream_Large_v1' ||
          plan.id === 'Mana_Stream_Large_Yearly_v1' ||
          plan.id === 'Mana_Stream_Giant_v1' ||
          plan.id === 'Mana_Stream_Giant_Yearly_v1')
    );

    return largerPlans;
  };

  // Filter-Items für den PillFilter
  const filterItems = [
    { id: 'individual', label: t('subscription.individual', 'Individual') },
    { id: 'team', label: t('subscription.team', 'Team') },
    { id: 'enterprise', label: t('subscription.enterprise', 'Enterprise') },
  ];

  // Handler für die Auswahl eines Filter-Items
  const handleFilterSelect = (id: string) => {
    setSelectedSubscriptionType(id as 'individual' | 'team' | 'enterprise');
  };

  // State für die Scroll-Position
  const [scrollY, setScrollY] = useState(0);
  const toggleThreshold = 425; // Ab dieser Scroll-Position wird der Toggle sticky

  // Scroll-Handler - nur zum Aktualisieren der Scroll-Position
  const handleScroll = (event: any) => {
    setScrollY(event.nativeEvent.contentOffset.y);
  };

  // Verwende useEffect, um auf Änderungen der Scroll-Position zu reagieren
  useEffect(() => {
    if (scrollY > toggleThreshold && !isBillingToggleSticky) {
      setIsBillingToggleSticky(true);
      // Animiere das Einfahren von oben
      Animated.spring(slideAnimation, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }).start();
    } else if (scrollY <= toggleThreshold && isBillingToggleSticky) {
      // Animiere das Ausfahren nach oben
      Animated.timing(slideAnimation, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setIsBillingToggleSticky(false);
      });
    }
  }, [scrollY, isBillingToggleSticky, slideAnimation]);

  // Keine doppelten Rendering-Funktionen mehr, da alles direkt im Return-Statement gerendert wird

  // Keine Beliebt-Sektion mehr

  // Render der Kosten und Nutzungsstatistiken (ohne Free-Tier)
  const renderActiveSection = () => {
    return (
      <View className="mb-8">
        <ScrollView className="flex-1 px-0 md:px-4">
          <View className="-mt-6 pb-2 pt-0">
            {/* Nutzungsstatistiken */}
            <View className="mb-4">
              <UsageCard
                usageData={usage}
                currentPlan={
                  currentUserPlanId
                    ? subscriptionOptions.find((plan) => plan.id === currentUserPlanId)?.name ||
                      currentUserPlanId
                    : undefined
                }
              />
            </View>

            {/* Kosten-Übersicht */}
            <View className="mb-4">
              <CostCard title={t('subscription.mana_costs', 'Mana Costs')} costs={appCosts} />
            </View>
          </View>
        </ScrollView>
      </View>
    );
  };

  // Mana-Akzentfarbe
  const manaAccentColor = '#4287f5'; // Blaue Farbe für Mana

  // Bestimme Farben basierend auf dem Theme
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const sectionTitleStyle = {
    color: textColor,
    fontSize: 24,
    fontWeight: 'bold' as const, // Type assertion to fix TypeScript error
    marginBottom: 16,
  };

  // BillingToggle für alle Abonnements (wird nur einmal angezeigt)
  const renderBillingToggle = (isSticky = false) => (
    <View className={isSticky ? '' : 'mb-4'} style={isSticky ? { marginBottom: 0 } : undefined}>
      <BillingToggle billingCycle={billingCycle} onChange={setBillingCycle} yearlyDiscount="33%" />
    </View>
  );

  // Get themed background color for sticky toggle
  const themeColors = (colors as any).theme?.extend?.colors;
  const stickyBackgroundColor = isDark
    ? themeColors?.dark?.[themeVariant]?.pageBackground || '#121212'
    : themeColors?.[themeVariant]?.pageBackground || '#FFFFFF';

  // Styles für den PillFilter und den sticky BillingToggle
  const styles = StyleSheet.create({
    pillFilterContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 10,
    },
    container: {
      flex: 1,
      position: 'relative',
      // paddingBottom: 60, // Platz für den PillFilter - entfernt
    },
    stickyBillingToggle: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      backgroundColor: stickyBackgroundColor,
      paddingTop: 4,
      paddingBottom: 2,
      paddingHorizontal: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
  });

  // Rendere nur die Abonnements und Pakete, die zum ausgewählten Typ passen
  const renderSubscriptionContent = () => {
    switch (selectedSubscriptionType) {
      case 'individual':
        return (
          <>
            {/* Einzel Abonnements */}
            <View
              style={{
                marginBottom: 0,
                paddingTop: 8,
                marginTop: 0,
              }}>
              <Text style={sectionTitleStyle}>
                {t('subscription.subscriptions', 'Subscriptions')}
              </Text>
              <View className="mb-8 flex-col md:flex-row md:flex-wrap">
                {/* Free Tier */}
                <View className="mb-4 w-full md:mr-4 md:w-[calc(50%-8px)] lg:w-[calc(50%-8px)] xl:w-[calc(33.33%-12px)]">
                  <SubscriptionCard
                    plan={subscriptionOptions.find((plan) => plan.id === 'free')!}
                    onSelect={handleSubscribe}
                    isCurrentPlan={currentUserPlanId === 'free' && !currentUserLegacyPlanId}
                  />
                </View>

                {/* User's Legacy Subscription (if any) */}
                {userLegacySubscription && (
                  <View className="mb-4 w-full md:mr-4 md:w-[calc(50%-8px)] lg:w-[calc(50%-8px)] xl:w-[calc(33.33%-12px)]">
                    <SubscriptionCard
                      plan={userLegacySubscription}
                      onSelect={() => {}}
                      isCurrentPlan={true}
                      isLegacy={true}
                    />
                  </View>
                )}

                {/* Bezahlte individuelle Abonnements (nur die ersten drei) */}
                {getSubscriptionPlans('individual', true).map((plan) => (
                  <View
                    key={plan.id}
                    className="mb-4 w-full md:mr-4 md:w-[calc(50%-8px)] lg:w-[calc(50%-8px)] xl:w-[calc(33.33%-12px)]">
                    <SubscriptionCard
                      plan={plan}
                      onSelect={handleSubscribe}
                      isCurrentPlan={currentUserPlanId === plan.id}
                    />
                  </View>
                ))}

                {/* Größere Abos Button */}
                {!showLargerPlans && (
                  <View className="mb-4 flex w-full items-center justify-center">
                    <Button
                      title={t('subscription.show_larger_plans', 'Show Larger Plans')}
                      variant="secondary"
                      iconName="chevron-down-outline"
                      onPress={() => setShowLargerPlans(true)}
                    />
                  </View>
                )}

                {/* Größere Abos (Mana See und Mana Meer) */}
                {showLargerPlans &&
                  getLargerPlans().map((plan) => (
                    <View
                      key={plan.id}
                      className="mb-4 w-full md:mr-4 md:w-[calc(50%-8px)] lg:w-[calc(50%-8px)] xl:w-[calc(33.33%-12px)]">
                      <SubscriptionCard
                        plan={plan}
                        onSelect={handleSubscribe}
                        isCurrentPlan={currentUserPlanId === plan.id}
                      />
                    </View>
                  ))}
              </View>
            </View>

            {/* Individuelle Pakete */}
            <View
              style={{
                marginBottom: 0,
                paddingTop: 0,
                marginTop: 0,
              }}>
              <Text style={sectionTitleStyle}>
                {t('subscription.one_time_purchases', 'One-time Purchases')}
              </Text>
              <View className="mb-0 flex-col md:flex-row md:flex-wrap">
                {/* Kleinere Pakete (Mana Flasche und Mana Fass) */}
                {getSmallerManaPackages().map((pkg) => (
                  <View
                    key={pkg.id}
                    className="mb-4 w-full md:mr-4 md:w-[calc(50%-8px)] lg:w-[calc(33.33%-12px)]">
                    <PackageCard package={pkg} onSelect={handleBuyPackage} />
                  </View>
                ))}

                {/* Größere Pakete Button */}
                {!showLargerPackages && (
                  <View className="mb-4 flex w-full items-center justify-center">
                    <Button
                      title={t('subscription.show_larger_packages', 'Show Larger Packages')}
                      variant="secondary"
                      iconName="chevron-down-outline"
                      onPress={() => setShowLargerPackages(true)}
                    />
                  </View>
                )}

                {/* Größere Pakete (Mana Tank und Mana Reservoir) */}
                {showLargerPackages &&
                  getLargerManaPackages().map((pkg) => (
                    <View
                      key={pkg.id}
                      className="mb-4 w-full md:mr-4 md:w-[calc(50%-8px)] lg:w-[calc(33.33%-12px)]">
                      <PackageCard package={pkg} onSelect={handleBuyPackage} />
                    </View>
                  ))}
              </View>
            </View>
          </>
        );

      case 'team':
        return (
          <>
            {/* Team-Abonnements */}
            <View
              style={{
                marginBottom: 16,
                paddingTop: 8,
                marginTop: 0,
              }}>
              <Text style={sectionTitleStyle}>
                {t('subscription.team_subscriptions', 'Team Subscriptions')}
              </Text>
              <View className="mb-0 flex-col md:flex-row md:flex-wrap">
                {/* Kleinere Team-Abos */}
                {getSmallerTeamPlans().map((plan) => (
                  <View
                    key={plan.id}
                    className="mb-4 w-full md:mr-4 md:w-[calc(50%-8px)] lg:w-[calc(50%-8px)] xl:w-[calc(33.33%-12px)]">
                    <SubscriptionCard
                      plan={plan}
                      onSelect={handleSubscribe}
                      isCurrentPlan={currentUserPlanId === plan.id}
                    />
                  </View>
                ))}

                {/* Größere Team-Abos Button */}
                {!showLargerTeamPlans && getLargerTeamPlans().length > 0 && (
                  <View className="mb-4 flex w-full items-center justify-center">
                    <Button
                      title={t('subscription.show_larger_team_plans', 'Show Larger Team Plans')}
                      variant="secondary"
                      iconName="chevron-down-outline"
                      onPress={() => setShowLargerTeamPlans(true)}
                    />
                  </View>
                )}

                {/* Größere Team-Abos */}
                {showLargerTeamPlans &&
                  getLargerTeamPlans().map((plan) => (
                    <View
                      key={plan.id}
                      className="mb-4 w-full md:mr-4 md:w-[calc(50%-8px)] lg:w-[calc(50%-8px)] xl:w-[calc(33.33%-12px)]">
                      <SubscriptionCard
                        plan={plan}
                        onSelect={handleSubscribe}
                        isCurrentPlan={currentUserPlanId === plan.id}
                      />
                    </View>
                  ))}
              </View>
            </View>

            {/* Team-Pakete */}
            <View
              style={{
                marginBottom: 0,
                paddingTop: 0,
                marginTop: 0,
              }}>
              <Text style={sectionTitleStyle}>
                {t('subscription.team_packages', 'Team Packages')}
              </Text>
              <View className="mb-0 flex-col md:flex-row md:flex-wrap">
                {/* Kleinere Team-Pakete */}
                {getSmallerTeamPackages().map((pkg) => (
                  <View
                    key={pkg.id}
                    className="mb-4 w-full md:mr-4 md:w-[calc(50%-8px)] lg:w-[calc(33.33%-12px)]">
                    <PackageCard package={pkg} onSelect={handleBuyPackage} />
                  </View>
                ))}

                {/* Größere Team-Pakete Button */}
                {!showLargerTeamPackages && getLargerTeamPackages().length > 0 && (
                  <View className="mb-4 flex w-full items-center justify-center">
                    <Button
                      title={t(
                        'subscription.show_larger_team_packages',
                        'Show Larger Team Packages'
                      )}
                      variant="secondary"
                      iconName="chevron-down-outline"
                      onPress={() => setShowLargerTeamPackages(true)}
                    />
                  </View>
                )}

                {/* Größere Team-Pakete */}
                {showLargerTeamPackages &&
                  getLargerTeamPackages().map((pkg) => (
                    <View
                      key={pkg.id}
                      className="mb-4 w-full md:mr-4 md:w-[calc(50%-8px)] lg:w-[calc(33.33%-12px)]">
                      <PackageCard package={pkg} onSelect={handleBuyPackage} />
                    </View>
                  ))}
              </View>
            </View>
          </>
        );

      case 'enterprise':
        return (
          <>
            {/* Enterprise-Abonnements */}
            <View
              style={{
                marginBottom: 16,
                paddingTop: 8,
                marginTop: 0,
              }}>
              <Text style={sectionTitleStyle}>
                {t('subscription.enterprise_subscriptions', 'Enterprise Subscriptions')}
              </Text>
              <View className="mb-8 flex-col md:flex-row md:flex-wrap">
                {/* Kleinere Enterprise-Abos */}
                {getSmallerEnterprisePlans().map((plan) => (
                  <View
                    key={plan.id}
                    className="mb-4 w-full md:mr-4 md:w-[calc(50%-8px)] lg:w-[calc(50%-8px)] xl:w-[calc(33.33%-12px)]">
                    <SubscriptionCard
                      plan={plan}
                      onSelect={handleSubscribe}
                      isCurrentPlan={currentUserPlanId === plan.id}
                    />
                  </View>
                ))}

                {/* Größere Enterprise-Abos Button */}
                {!showLargerEnterprisePlans && getLargerEnterprisePlans().length > 0 && (
                  <View className="mb-4 flex w-full items-center justify-center">
                    <Button
                      title={t(
                        'subscription.show_larger_enterprise_plans',
                        'Show Larger Enterprise Plans'
                      )}
                      variant="secondary"
                      iconName="chevron-down-outline"
                      onPress={() => setShowLargerEnterprisePlans(true)}
                    />
                  </View>
                )}

                {/* Größere Enterprise-Abos */}
                {showLargerEnterprisePlans &&
                  getLargerEnterprisePlans().map((plan) => (
                    <View
                      key={plan.id}
                      className="mb-4 w-full md:mr-4 md:w-[calc(50%-8px)] lg:w-[calc(50%-8px)] xl:w-[calc(33.33%-12px)]">
                      <SubscriptionCard
                        plan={plan}
                        onSelect={handleSubscribe}
                        isCurrentPlan={currentUserPlanId === plan.id}
                      />
                    </View>
                  ))}
              </View>
            </View>

            {/* Enterprise-Pakete */}
            <View
              style={{
                marginBottom: 0,
                paddingTop: 0,
                marginTop: 0,
              }}>
              <Text style={sectionTitleStyle}>
                {t('subscription.enterprise_packages', 'Enterprise Packages')}
              </Text>
              <View className="mb-0 flex-col md:flex-row md:flex-wrap">
                {/* Kleinere Enterprise-Pakete */}
                {getSmallerEnterprisePackages().map((pkg) => (
                  <View
                    key={pkg.id}
                    className="mb-4 w-full md:mr-4 md:w-[calc(50%-8px)] lg:w-[calc(33.33%-12px)]">
                    <PackageCard package={pkg} onSelect={handleBuyPackage} />
                  </View>
                ))}

                {/* Größere Enterprise-Pakete Button */}
                {!showLargerEnterprisePackages && getLargerEnterprisePackages().length > 0 && (
                  <View className="mb-4 flex w-full items-center justify-center">
                    <Button
                      title={t(
                        'subscription.show_larger_enterprise_packages',
                        'Show Larger Enterprise Packages'
                      )}
                      variant="secondary"
                      iconName="chevron-down-outline"
                      onPress={() => setShowLargerEnterprisePackages(true)}
                    />
                  </View>
                )}

                {/* Größere Enterprise-Pakete */}
                {showLargerEnterprisePackages &&
                  getLargerEnterprisePackages().map((pkg) => (
                    <View
                      key={pkg.id}
                      className="mb-4 w-full md:mr-4 md:w-[calc(50%-8px)] lg:w-[calc(33.33%-12px)]">
                      <PackageCard package={pkg} onSelect={handleBuyPackage} />
                    </View>
                  ))}
              </View>
            </View>
          </>
        );

      default:
        return null;
    }
  };

  // Show loading state while data is being fetched
  if (isLoadingData) {
    return <SubscriptionPageSkeleton />;
  }

  // Show error state if no data is available
  if (!subscriptionServiceData || dataError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: isDark ? '#FFFFFF' : '#000000', textAlign: 'center' }}>
          {dataError || t('subscription.failed_to_load', 'Failed to load subscription data')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        onScroll={handleScroll}
        scrollEventThrottle={16} // Optimiert die Scroll-Performance
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 0,
          paddingBottom: 64, // Erhöhter Abstand nach unten
          maxWidth: 1200,
          width: '100%',
          alignSelf: 'center',
        }}>
        {/* Aktiver Abschnitt */}
        {renderActiveSection()}

        {/* BillingToggle für alle Abonnements (normale Position) */}
        {renderBillingToggle()}

        {/* Abonnements und Pakete basierend auf dem ausgewählten Typ */}
        {renderSubscriptionContent()}
      </ScrollView>

      {/* Sticky BillingToggle am oberen Rand */}
      {isBillingToggleSticky && (
        <Animated.View
          style={[styles.stickyBillingToggle, { transform: [{ translateY: slideAnimation }] }]}>
          {renderBillingToggle(true)}
        </Animated.View>
      )}

      {/* PillFilter am unteren Rand - auskommentiert */}
      {/* <View style={styles.pillFilterContainer}>
        <PillFilter
          items={filterItems}
          selectedIds={[selectedSubscriptionType]}
          onSelectItem={handleFilterSelect}
          showAllOption={false}
        />
      </View> */}
    </View>
  );
};

export default SubscriptionPage;
