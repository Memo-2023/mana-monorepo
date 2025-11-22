import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import colors from '~/tailwind.config.js';

/**
 * Skeleton loader for SubscriptionPage component
 * Shows loading state for subscription cards and usage statistics
 */
const SubscriptionPageSkeleton = () => {
  const { isDark, themeVariant } = useTheme();

  // Get theme colors
  const borderColor = isDark
    ? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.border || '#424242'
    : (colors as any).theme?.extend?.colors?.[themeVariant]?.border || '#e6e6e6';

  const backgroundColor = isDark
    ? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.contentBackground
    : (colors as any).theme?.extend?.colors?.[themeVariant]?.contentBackground;

  const skeletonColor = isDark ? '#3a3a3a' : '#e0e0e0';
  const shimmerColor = isDark ? '#4a4a4a' : '#f0f0f0';

  // Skeleton for a card component
  const CardSkeleton = ({ height = 200 }: { height?: number }) => (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor,
          height,
        },
      ]}>
      {/* Title skeleton */}
      <View style={[styles.titleSkeleton, { backgroundColor: skeletonColor }]} />

      {/* Content lines */}
      <View style={styles.contentContainer}>
        <View style={[styles.contentLine, { backgroundColor: skeletonColor, width: '90%' }]} />
        <View style={[styles.contentLine, { backgroundColor: skeletonColor, width: '75%' }]} />
        <View style={[styles.contentLine, { backgroundColor: skeletonColor, width: '60%' }]} />
      </View>

      {/* Button skeleton */}
      <View style={[styles.buttonSkeleton, { backgroundColor: skeletonColor }]} />
    </View>
  );

  // Skeleton for usage/cost cards
  const InfoCardSkeleton = () => (
    <View
      style={[
        styles.infoCard,
        {
          backgroundColor,
          borderColor,
        },
      ]}>
      <View style={[styles.infoTitleSkeleton, { backgroundColor: skeletonColor }]} />
      <View style={styles.infoContent}>
        <View style={[styles.infoLine, { backgroundColor: skeletonColor, width: '80%' }]} />
        <View style={[styles.infoLine, { backgroundColor: skeletonColor, width: '65%' }]} />
      </View>
    </View>
  );

  // Skeleton for billing toggle
  const BillingToggleSkeleton = () => (
    <View style={[styles.billingToggle, { backgroundColor: skeletonColor }]} />
  );

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Usage and Cost cards section */}
      <View style={styles.section}>
        <InfoCardSkeleton />
        <InfoCardSkeleton />
      </View>

      {/* Billing toggle */}
      <View style={styles.toggleSection}>
        <BillingToggleSkeleton />
      </View>

      {/* Section title skeleton */}
      <View style={[styles.sectionTitleSkeleton, { backgroundColor: skeletonColor }]} />

      {/* Subscription cards */}
      <View style={styles.cardsGrid}>
        <View style={styles.cardWrapper}>
          <CardSkeleton />
        </View>
        <View style={styles.cardWrapper}>
          <CardSkeleton />
        </View>
        <View style={styles.cardWrapper}>
          <CardSkeleton />
        </View>
      </View>

      {/* Section title skeleton for packages */}
      <View
        style={[styles.sectionTitleSkeleton, { backgroundColor: skeletonColor, marginTop: 32 }]}
      />

      {/* Package cards */}
      <View style={styles.cardsGrid}>
        <View style={styles.cardWrapper}>
          <CardSkeleton height={180} />
        </View>
        <View style={styles.cardWrapper}>
          <CardSkeleton height={180} />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 64,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  section: {
    marginBottom: 16,
  },
  toggleSection: {
    marginBottom: 24,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  cardWrapper: {
    width: '100%',
    marginBottom: 16,
    paddingRight: 0,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  infoCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  titleSkeleton: {
    height: 24,
    width: 150,
    borderRadius: 4,
    opacity: 0.7,
    marginBottom: 16,
  },
  infoTitleSkeleton: {
    height: 20,
    width: 120,
    borderRadius: 4,
    opacity: 0.7,
    marginBottom: 12,
  },
  sectionTitleSkeleton: {
    height: 28,
    width: 200,
    borderRadius: 4,
    opacity: 0.7,
    marginBottom: 16,
  },
  contentContainer: {
    marginBottom: 20,
  },
  contentLine: {
    height: 14,
    borderRadius: 3,
    marginBottom: 8,
    opacity: 0.5,
  },
  infoContent: {
    marginTop: 8,
  },
  infoLine: {
    height: 12,
    borderRadius: 3,
    marginBottom: 6,
    opacity: 0.5,
  },
  buttonSkeleton: {
    height: 44,
    borderRadius: 12,
    opacity: 0.6,
    marginTop: 'auto',
  },
  billingToggle: {
    height: 56,
    borderRadius: 28,
    opacity: 0.6,
  },
});

// Responsive styles for tablets and larger screens
const responsiveStyles = StyleSheet.create({
  cardWrapper: {
    '@media (min-width: 768px)': {
      width: 'calc(50% - 8px)',
      marginRight: 16,
    },
    '@media (min-width: 1024px)': {
      width: 'calc(33.33% - 12px)',
    },
  },
});

export default SubscriptionPageSkeleton;
