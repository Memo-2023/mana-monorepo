import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator, Linking, Alert, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter } from 'expo-router';
import { theme } from '../src/theme/theme';
import Button from '../components/atoms/Button';
import Text from '../components/atoms/Text';
import { supabase } from '../src/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useManaBalance } from '../hooks/useManaBalance';
import { useAuth } from '../src/contexts/AuthContext';
import CommonHeader from '../components/molecules/CommonHeader';
import ManaIcon from '../components/icons/ManaIcon';
import {
  getSubscriptionData,
  purchaseSubscription,
  purchaseManaPackage,
  restorePurchases,
} from '../src/features/subscription/revenueCatManager';
import type {
  RevenueCatSubscriptionPlan,
  RevenueCatManaPackage,
} from '../src/features/subscription/subscriptionTypes';
import { ParentalGate } from '../src/components/ParentalGate';
import { useParentalGate } from '../src/hooks/useParentalGate';

type SubscriptionPlan = 'free' | 'mini' | 'plus' | 'pro' | 'giant';
type PackageSize = 'small' | 'medium' | 'large' | 'xlarge' | 'team-small' | 'team-medium' | 'team-large';

interface SubscriptionOption {
  id: SubscriptionPlan;
  name: string;
  price: number;
  mana: number;
}

interface ManaPackage {
  id: PackageSize;
  name: string;
  manaAmount: number;
  price: number;
  isTeamPackage?: boolean;
}

const subscriptionOptions: SubscriptionOption[] = [
  {
    id: 'free',
    name: 'Mana-Tropfen',
    price: 0,
    mana: 150,
  },
  {
    id: 'mini',
    name: 'Kleiner Mana Stream',
    price: 5.99,
    mana: 600,
  },
  {
    id: 'plus',
    name: 'Mittlerer Mana Stream',
    price: 14.99,
    mana: 1500,
  },
  {
    id: 'pro',
    name: 'Großer Mana Stream',
    price: 29.99,
    mana: 3000,
  },
  {
    id: 'giant',
    name: 'Riesiger Mana Stream',
    price: 49.99,
    mana: 5000,
  },
];

const manaPackages: ManaPackage[] = [
  {
    id: 'small',
    name: 'Kleiner Mana Trank',
    manaAmount: 350,
    price: 4.99,
  },
  {
    id: 'medium',
    name: 'Mittlerer Mana Trank',
    manaAmount: 700,
    price: 9.99,
  },
  {
    id: 'large',
    name: 'Großer Mana Trank',
    manaAmount: 1400,
    price: 19.99,
  },
  {
    id: 'xlarge',
    name: 'Riesiger Mana Trank',
    manaAmount: 2800,
    price: 39.99,
  },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { manaBalance, userData, loading, error, refetch } = useManaBalance();
  const { width: screenWidth } = useWindowDimensions();
  const { isVisible: isParentalGateVisible, config: parentalGateConfig, setIsVisible: setParentalGateVisible, openEmailWithGate, openExternalLinkWithGate, requestParentalPermission } = useParentalGate();

  // Responsive layout detection
  const isTablet = screenWidth >= 768;
  const isWideScreen = screenWidth >= 1024;

  // RevenueCat subscription data
  const [rcSubscriptions, setRcSubscriptions] = useState<RevenueCatSubscriptionPlan[]>([]);
  const [rcPackages, setRcPackages] = useState<RevenueCatManaPackage[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Load subscription data from RevenueCat
  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoadingSubscriptions(true);
      const data = await getSubscriptionData();
      console.log('[Subscription] Loaded data:', {
        subscriptions: data.subscriptions.length,
        packages: data.packages.length,
        isFromRevenueCat: data.isFromRevenueCat,
      });
      setRcSubscriptions(data.subscriptions);
      setRcPackages(data.packages);
    } catch (error) {
      console.error('[Subscription] Error loading data:', error);
      Alert.alert('Fehler', 'Abonnements konnten nicht geladen werden');
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const handleSubscribe = async (subscriptionId: string, billingCycle: 'monthly' | 'yearly') => {
    // Require parental permission before purchase
    const granted = await requestParentalPermission({
      title: 'Abonnement kaufen',
      message: 'Um ein Abonnement zu kaufen, löse bitte diese Rechenaufgabe:',
    });

    if (!granted) {
      return;
    }

    try {
      setPurchasing(true);
      console.log(`[Subscription] Purchasing: ${subscriptionId} (${billingCycle})`);

      const customerInfo = await purchaseSubscription(subscriptionId, billingCycle);
      console.log('[Subscription] Purchase successful:', customerInfo);

      // Refresh mana balance
      await refetch();

      Alert.alert(
        'Erfolgreich!',
        'Dein Abonnement wurde aktiviert.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('[Subscription] Purchase error:', error);
      if (!error.userCancelled) {
        Alert.alert(
          'Fehler',
          error.message || 'Der Kauf konnte nicht abgeschlossen werden. Bitte versuche es erneut.'
        );
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleBuyPackage = async (packageId: string) => {
    // Require parental permission before purchase
    const granted = await requestParentalPermission({
      title: 'Mana kaufen',
      message: 'Um Mana zu kaufen, löse bitte diese Rechenaufgabe:',
    });

    if (!granted) {
      return;
    }

    try {
      setPurchasing(true);
      console.log(`[Subscription] Buying package: ${packageId}`);

      const customerInfo = await purchaseManaPackage(packageId);
      console.log('[Subscription] Package purchase successful:', customerInfo);

      // Refresh mana balance
      await refetch();

      Alert.alert(
        'Erfolgreich!',
        'Dein Mana wurde aufgeladen.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('[Subscription] Package purchase error:', error);
      if (!error.userCancelled) {
        Alert.alert(
          'Fehler',
          error.message || 'Der Kauf konnte nicht abgeschlossen werden. Bitte versuche es erneut.'
        );
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setPurchasing(true);
      Alert.alert('Käufe werden wiederhergestellt...', 'Bitte warten');

      const customerInfo = await restorePurchases();
      console.log('[Subscription] Purchases restored:', customerInfo);

      await refetch();

      Alert.alert(
        'Erfolgreich!',
        'Deine Käufe wurden wiederhergestellt.'
      );
    } catch (error: any) {
      console.error('[Subscription] Restore error:', error);
      Alert.alert(
        'Fehler',
        'Käufe konnten nicht wiederhergestellt werden. Bitte versuche es erneut.'
      );
    } finally {
      setPurchasing(false);
    }
  };

  const formatPrice = (price: number) => {
    return price.toFixed(2).replace('.', ',') + ' €';
  };

  const renderBillingToggle = () => {
    return (
      <View style={styles.billingToggle}>
        <Pressable
          style={[
            styles.billingOption,
            selectedBillingCycle === 'monthly' && styles.selectedBillingOption,
          ]}
          onPress={() => setSelectedBillingCycle('monthly')}
        >
          <Text
            variant="body"
            style={[
              styles.billingText,
              selectedBillingCycle === 'monthly' && styles.selectedBillingText,
            ]}
          >
            Monatlich
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.billingOption,
            selectedBillingCycle === 'yearly' && styles.selectedBillingOption,
          ]}
          onPress={() => setSelectedBillingCycle('yearly')}
        >
          <Text
            variant="body"
            style={[
              styles.billingText,
              selectedBillingCycle === 'yearly' && styles.selectedBillingText,
            ]}
          >
            Jährlich
          </Text>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>Spare 17%</Text>
          </View>
        </Pressable>
      </View>
    );
  };

  const renderSubscriptionOptions = () => {
    if (loadingSubscriptions) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text variant="body" color="rgba(255, 255, 255, 0.7)" style={{ marginTop: 10 }}>
            Lade Abonnements...
          </Text>
        </View>
      );
    }

    // Filter subscriptions by billing cycle
    const filteredSubscriptions = rcSubscriptions.filter(
      (sub) => sub.billingCycle === selectedBillingCycle
    );

    // Extract base subscription ID (e.g., 'small' from 'small_monthly')
    const getBaseSubscriptionId = (id: string) => id.split('_')[0];

    // Calculate card width based on screen size
    const getCardWidth = () => {
      if (isWideScreen) return '32%'; // 3 columns
      if (isTablet) return '48%'; // 2 columns
      return '100%'; // 1 column on phone
    };

    return (
      <View style={styles.sectionContainer}>
        <View style={[styles.planList, isTablet && styles.planListHorizontal]}>
          {filteredSubscriptions.map((plan) => (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                isTablet && { width: getCardWidth() },
              ]}
            >
              <View style={styles.planCardContent}>
                <View style={styles.planCardLeft}>
                  <Text variant="subheader" color="#fff" style={styles.planName}>{plan.name}</Text>
                  <Text variant="body" color="rgba(255, 255, 255, 0.7)" style={styles.planPriceLabel}>
                    {plan.priceString} / {selectedBillingCycle === 'monthly' ? 'Monat' : 'Jahr'}
                  </Text>
                </View>

                <View style={styles.planCardRight}>
                  <View style={styles.manaDisplayContainer}>
                    <Text variant="header" color="#4A90E2" style={styles.manaAmount}>{plan.mana}</Text>
                    <Text variant="body" color="rgba(255, 255, 255, 0.7)" style={styles.manaLabel}>Mana / Monat</Text>
                  </View>
                </View>
              </View>

              <Button
                title={`Kaufen für ${plan.priceString}`}
                onPress={() => handleSubscribe(getBaseSubscriptionId(plan.id), selectedBillingCycle)}
                variant="primary"
                size="md"
                color="#4A9EFF"
                style={styles.planButton}
                disabled={purchasing}
              />
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderBalanceView = () => {
    return (
      <View style={styles.balanceContainer}>
        <View style={styles.manaDropContainer}>
          <View style={styles.manaDropIcon}>
            <ManaIcon size={80} color="#4A90E2" />
          </View>
          <Text variant="header" color="#FFFFFF" style={styles.manaTitle}>Dein Mana</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#4A90E2" style={{ marginTop: 10 }} />
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text variant="subheader" color="#FF6B6B" style={styles.errorText}>Fehler beim Laden</Text>
              <Text variant="caption" color="rgba(255, 255, 255, 0.5)" style={styles.errorDetail}>{error}</Text>
              <Pressable
                style={styles.retryButton}
                onPress={refetch}
              >
                <Text variant="body" color="#000" style={styles.retryText}>Erneut versuchen</Text>
              </Pressable>
            </View>
          ) : (
            <Text variant="header" color="#4A90E2" style={styles.manaValue}>{manaBalance !== null ? manaBalance : 0} Mana</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text variant="subheader" color="#FFFFFF" style={styles.sectionTitle}>Was ist Mana?</Text>
          <Text variant="body" color="rgba(255, 255, 255, 0.7)" style={styles.sectionText}>
            Mana ist deine kreative Energiewährung. Nutze es, um Geschichten zu generieren, Charaktere zu erstellen und spezielle Funktionen freizuschalten.
          </Text>
        </View>

        <View style={styles.section}>
          <Text variant="subheader" color="#FFFFFF" style={styles.sectionTitle}>Mana-Kosten</Text>
          <View style={styles.historyItem}>
            <Text variant="body" color="rgba(255, 255, 255, 0.7)" style={styles.historyText}>Story Generation</Text>
            <Text variant="body" color="#4A90E2" style={styles.historyMana}>100 Mana</Text>
          </View>
          <View style={styles.historyItem}>
            <Text variant="body" color="rgba(255, 255, 255, 0.7)" style={styles.historyText}>Charakter Erstellung</Text>
            <Text variant="body" color="#4A90E2" style={styles.historyMana}>30 Mana</Text>
          </View>
        </View>

      </View>
    );
  };

  const renderPackageOptions = () => {
    if (loadingSubscriptions) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text variant="body" color="rgba(255, 255, 255, 0.7)" style={{ marginTop: 10 }}>
            Lade Pakete...
          </Text>
        </View>
      );
    }

    // Calculate package card width based on screen size
    const getPackageCardWidth = () => {
      if (isWideScreen) return '23%'; // 4 columns
      if (isTablet) return '31%'; // 3 columns
      return '48%'; // 2 columns on phone
    };

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.packageList}>
          {rcPackages.map((pkg) => (
            <View
              key={pkg.id}
              style={[
                styles.packageCard,
                { width: getPackageCardWidth() },
              ]}
            >
              <Text variant="subheader" color="#fff" style={styles.packageName}>{pkg.name}</Text>
              <Text variant="caption" color="rgba(255, 255, 255, 0.7)" style={styles.packageMana}>
                {pkg.manaAmount} Mana
              </Text>
              <Text variant="subheader" color="#fff" style={styles.packagePrice}>{pkg.priceString}</Text>
              <Button
                title="Kaufen"
                onPress={() => handleBuyPackage(pkg.id)}
                variant="primary"
                size="sm"
                color="#4A9EFF"
                style={styles.packageButton}
                disabled={purchasing}
              />
            </View>
          ))}
        </View>
      </View>
    );
  };

  const handleContactPress = () => {
    openEmailWithGate('kontakt@memoro.ai');
  };

  const handleFeedbackPress = () => {
    router.push('/feedback');
  };

  const handlePrivacyPress = () => {
    openExternalLinkWithGate('https://märchen-zauber.de/privacy', {
      title: 'Datenschutzerklärung öffnen',
      message: 'Um die Datenschutzerklärung zu öffnen, löse bitte diese Rechenaufgabe:',
    });
  };

  const handleTermsPress = () => {
    openExternalLinkWithGate('https://märchen-zauber.de/terms', {
      title: 'AGB öffnen',
      message: 'Um die AGB zu öffnen, löse bitte diese Rechenaufgabe:',
    });
  };

  const renderContactSection = () => {
    return (
      <View style={styles.contactContainer}>
        <Text variant="header" color="#FFFFFF" style={styles.contactTitle}>
          Hilfe & Support
        </Text>
        <Text variant="body" color="rgba(255, 255, 255, 0.7)" style={styles.contactSubtitle}>
          Hast du Fragen oder benötigst Hilfe? Wir sind für dich da!
        </Text>
        <Button
          title="Käufe wiederherstellen"
          onPress={handleRestorePurchases}
          variant="primary"
          size="md"
          color="#4A9EFF"
          iconName="arrow.clockwise"
          iconSet="sf-symbols"
          iconPosition="left"
          style={styles.feedbackButton}
          disabled={purchasing}
        />
        <Button
          title="Feedback & Wünsche"
          onPress={handleFeedbackPress}
          variant="primary"
          size="md"
          color="#4A9EFF"
          iconName="bubble.left"
          iconSet="sf-symbols"
          iconPosition="left"
          style={styles.feedbackButton}
        />
        <Button
          title="Support kontaktieren"
          onPress={handleContactPress}
          variant="primary"
          size="md"
          color="#333333"
          iconName="envelope"
          iconSet="sf-symbols"
          iconPosition="left"
          style={styles.contactButton}
        />

        <View style={styles.legalLinksContainer}>
          <Text variant="subheader" color="#FFFFFF" style={styles.legalLinksTitle}>
            Rechtliches
          </Text>
          <Button
            title="Datenschutzerklärung"
            onPress={handlePrivacyPress}
            variant="primary"
            size="md"
            color="#444444"
            iconName="shield"
            iconSet="sf-symbols"
            iconPosition="left"
            style={styles.legalLinkButton}
          />
          <Button
            title="Allgemeine Geschäftsbedingungen"
            onPress={handleTermsPress}
            variant="primary"
            size="md"
            color="#444444"
            iconName="doc.text"
            iconSet="sf-symbols"
            iconPosition="left"
            style={styles.legalLinkButton}
          />
        </View>

        <View style={styles.subscriptionInfo}>
          <Text variant="caption" color="rgba(255, 255, 255, 0.6)" style={styles.subscriptionInfoText}>
            Abonnements verlängern sich automatisch, sofern nicht 24 Stunden vor Ablauf des aktuellen Zeitraums gekündigt wird. Dein Konto wird innerhalb von 24 Stunden vor Ende des aktuellen Zeitraums für die Verlängerung belastet.
            {'\n\n'}
            Du kannst deine Abonnements in deinen App Store Kontoeinstellungen nach dem Kauf verwalten und kündigen.
          </Text>
        </View>
      </View>
    );
  };

  const renderOtherApps = () => {
    const apps = [
      {
        id: 'memoro',
        name: 'Memoro',
        description: 'Meeting Protokoll Software und KI-Transkription. Einfach sprechen - Memoro schreibt das Protokoll. Sparen Sie 3+ Stunden pro Woche.',
        icon: 'mic',
        color: '#2ECC71',
        url: 'https://memoro.ai/de/download',
        available: true,
        useImage: true,
        image: require('../assets/images/Memoro-App-Icon.png'),
      },
      {
        id: 'storyteller',
        name: 'Märchenzauber',
        description: 'Erstelle magische Kindergeschichten mit KI. Personalisierte Charaktere und wunderschöne Illustrationen.',
        icon: 'book',
        color: '#9B59B6',
        url: 'https://märchen-zauber.de',
        available: true,
        useImage: true,
        image: require('../assets/images/icon.png'),
      },
      {
        id: 'placeholder1',
        name: 'Weitere Apps',
        description: 'Bald verfügbar - Entdecke weitere kreative Apps, die mit deinem Mana-Konto funktionieren.',
        icon: 'apps',
        color: '#3498DB',
        url: null,
        available: false,
        useImage: false,
      },
    ];

    const handleAppPress = async (url: string | null) => {
      if (url) {
        try {
          const supported = await Linking.canOpenURL(url);
          if (supported) {
            await Linking.openURL(url);
          } else {
            console.error(`Cannot open URL: ${url}`);
          }
        } catch (error) {
          console.error('Error opening URL:', error);
        }
      }
    };

    // Calculate app card width based on screen size
    const getAppCardWidth = () => {
      if (isWideScreen) return '32%'; // 3 columns
      if (isTablet) return '48%'; // 2 columns
      return '100%'; // 1 column on phone
    };

    return (
      <View style={styles.otherAppsContainer}>
        <Text variant="header" color="#FFFFFF" style={styles.otherAppsTitle}>
          Ein Mana-Konto für alle Apps
        </Text>
        <Text variant="body" color="rgba(255, 255, 255, 0.7)" style={styles.otherAppsSubtitle}>
          Nutze dein Mana in all unseren kreativen Apps
        </Text>

        <View style={styles.appsList}>
          {apps.map((app) => (
            <View
              key={app.id}
              style={[
                styles.appCard,
                { width: getAppCardWidth() }
              ]}
            >
              {app.useImage && app.image ? (
                <View style={styles.appImageContainer}>
                  <Image source={app.image} style={styles.appImage} />
                </View>
              ) : (
                <View style={styles.appIconContainer}>
                  <Ionicons name={app.icon as any} size={48} color={app.color} />
                </View>
              )}
              <Text variant="subheader" color="#fff" style={styles.appName}>{app.name}</Text>
              <Text variant="body" color="rgba(255, 255, 255, 0.7)" style={styles.appDescription}>
                {app.description}
              </Text>
              <Button
                title={app.available ? 'Mehr erfahren' : 'Bald verfügbar'}
                onPress={() => handleAppPress(app.url)}
                variant="primary"
                size="sm"
                color="#4A9EFF"
                disabled={!app.available}
                style={styles.appButton}
              />
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ParentalGate
        visible={isParentalGateVisible}
        onSuccess={() => {
          setParentalGateVisible(false);
          parentalGateConfig.onSuccess?.();
        }}
        onCancel={() => setParentalGateVisible(false)}
        title={parentalGateConfig.title}
        message={parentalGateConfig.message}
      />
      <CommonHeader
        title="Mana"
        showBackButton={true}
        showSettingsButton={false}
        showManaButton={false}
      />
      <View style={styles.container}>
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {renderBalanceView()}

          <Text variant="header" color="#FFFFFF" style={styles.mainSectionTitle}>Mana Tränke</Text>
          <Text variant="body" color="rgba(255, 255, 255, 0.6)" style={styles.sectionSubtitle}>1 Mana = 1,4 Cent</Text>
          {renderPackageOptions()}

          <View style={styles.divider} />

          {renderOtherApps()}

          <View style={styles.divider} />

          {renderContactSection()}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 100, // Abstand für den Header
    paddingBottom: 0,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  billingToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    marginBottom: 24,
    padding: 4,
  },
  billingOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  selectedBillingOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  billingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedBillingText: {
    color: theme.colors.yellow.dark,
  },
  discountBadge: {
    backgroundColor: theme.colors.yellow.dark,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  discountText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  planList: {
    gap: 12,
    marginBottom: 24,
  },
  planListHorizontal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  planCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  planCardLeft: {
    flex: 1,
    justifyContent: 'center',
  },
  planCardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  selectedPlanCard: {
    borderColor: theme.colors.yellow.dark,
    borderWidth: 2,
  },
  planName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  planPriceLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 20,
    fontWeight: '600',
  },
  manaDisplayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 12,
    minWidth: 120,
  },
  manaAmount: {
    color: '#4A90E2',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  manaLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    textAlign: 'center',
  },
  planButton: {
    marginTop: 16,
    width: '100%',
  },
  detailIcon: {
    marginRight: 12,
  },
  detailTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
    width: 120, // Fixed width for all labels to align values
  },
  detailValue: {
    color: '#fff',
    fontWeight: '500',
    flex: 1,
  },
  packageSectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 24,
  },
  packageList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  packageCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  teamPackageCard: {
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  selectedPackageCard: {
    borderColor: theme.colors.yellow.dark,
    borderWidth: 2,
  },
  packageName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  packageMana: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  packagePrice: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  packageButton: {
    marginTop: 8,
    width: '100%',
  },
  actionButton: {
    marginTop: 24,
  },
  // Balance view styles
  balanceContainer: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  manaDropContainer: {
    alignItems: 'center',
    marginBottom: 40,
    padding: 30,
    backgroundColor: 'rgba(74, 144, 226, 0.05)',
    borderRadius: 20,
  },
  manaDropIcon: {
    marginBottom: 20,
  },
  manaTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  manaValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  sectionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 24,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  historyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  historyMana: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
  errorContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    marginBottom: 5,
  },
  errorDetail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.colors.yellow.dark,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  retryText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // New styles for single page layout
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 40,
  },
  mainSectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  sectionContainer: {
    width: '100%',
    marginBottom: 20,
  },
  // Other apps section styles
  otherAppsContainer: {
    width: '100%',
    marginBottom: 40,
  },
  otherAppsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  otherAppsSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 24,
    textAlign: 'center',
  },
  appsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  appCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  appIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  appImageContainer: {
    width: 90,
    height: 90,
    borderRadius: 22,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    padding: 5,
  },
  appImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  appDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  appButton: {
    width: '100%',
    marginTop: 8,
  },
  // Contact section styles
  contactContainer: {
    width: '100%',
    marginBottom: 40,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  contactSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 24,
    textAlign: 'center',
  },
  feedbackButton: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 12,
  },
  contactButton: {
    width: '100%',
    maxWidth: 300,
  },
  legalLinksContainer: {
    marginTop: 32,
    width: '100%',
    alignItems: 'center',
  },
  legalLinksTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  legalLinkButton: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 12,
  },
  subscriptionInfo: {
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    width: '100%',
    maxWidth: 500,
  },
  subscriptionInfoText: {
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
});
