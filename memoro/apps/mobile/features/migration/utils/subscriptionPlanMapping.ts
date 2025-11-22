export const subscriptionPlanMapping: Record<string, string> = {
  // Monthly subscriptions
  Mini_1m_v1: 'Mini Monatlich',
  Plus_7E_1m_v1: 'Plus Monatlich',
  Pro_23E_1m_v1: 'Pro Monatlich',
  Ultra_47E_1m_v1: 'Ultra Monatlich',

  // Yearly subscriptions
  Mini_1y_v1: 'Mini Jährlich',
  Plus_70E_1y_v1: 'Plus Jährlich',
  Pro_230E_1y_v1: 'Pro Jährlich',
  Ultra_470E_1y_v1: 'Ultra Jährlich',
};

export const getSubscriptionDisplayName = (
  subscriptionPlanId?: string | null,
  isActiveSubscription?: boolean
): string => {
  // If subscription is not active or doesn't exist, return "Free Abo"
  if (!isActiveSubscription || !subscriptionPlanId) {
    return 'Free Abo';
  }

  return subscriptionPlanMapping[subscriptionPlanId] || 'Free Abo';
};

export const getSubscriptionTier = (
  subscriptionPlanId?: string | null,
  isActiveSubscription?: boolean
): string => {
  // If subscription is not active or doesn't exist, return "Free"
  if (!isActiveSubscription || !subscriptionPlanId) {
    return 'Free';
  }

  // Extract tier from subscription plan ID
  if (subscriptionPlanId.includes('Mini')) return 'Mini';
  if (subscriptionPlanId.includes('Plus')) return 'Plus';
  if (subscriptionPlanId.includes('Pro')) return 'Pro';
  if (subscriptionPlanId.includes('Ultra')) return 'Ultra';

  return 'Free';
};

export const isYearlySubscription = (subscriptionPlanId?: string | null): boolean => {
  if (!subscriptionPlanId) return false;
  return subscriptionPlanId.includes('_1y_');
};

export const getSubscriptionPrices = () => {
  return {
    monthly: {
      Mini: '1€',
      Plus: '7€',
      Pro: '23€',
      Ultra: '47€',
    },
    yearly: {
      Mini: '10€',
      Plus: '70€',
      Pro: '230€',
      Ultra: '470€',
    },
  };
};
