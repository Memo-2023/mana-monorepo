import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { authService } from '~/features/auth/services/authService';

interface B2BInfo {
  disableRevenueCat: boolean;
  organizationId?: string;
  plan?: string;
  role?: string;
}

export const B2BSubscriptionMessage: React.FC = () => {
  const { t } = useTranslation();
  const [b2bInfo, setB2BInfo] = useState<B2BInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchB2BInfo = async () => {
      try {
        const info = await authService.getB2BInfo();
        console.log('[B2BSubscriptionMessage] B2B info:', info);
        setB2BInfo(info);
      } catch (error) {
        console.error('Error fetching B2B info:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchB2BInfo();
  }, []);

  // Show loading state
  if (isLoading) {
    return null;
  }

  return (
    <View className="flex-1 p-6 bg-gray-50 dark:bg-gray-900" style={{ paddingTop: 0 }}>
      <View className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg max-w-md w-full" style={{ marginTop: 0 }}>
        {/* Header */}
        <View className="items-center mb-6">
          <View className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full items-center justify-center mb-4">
            <Text className="text-2xl">🏢</Text>
          </View>
          <Text className="text-xl font-bold text-gray-900 dark:text-white text-center">
            {t('subscription.b2b.title', 'Enterprise Account')}
          </Text>
        </View>

        {/* Content */}
        <View className="space-y-4">
          <Text className="text-gray-600 dark:text-gray-300 text-center">
            {t('subscription.b2b.message', 'You have an enterprise account with managed billing.')}
          </Text>

          {b2bInfo?.organizationId && (
            <View className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('subscription.b2b.organization', 'Organization')}
              </Text>
              <Text className="text-gray-900 dark:text-white">
                {b2bInfo.organizationId}
              </Text>
            </View>
          )}

          {b2bInfo?.plan && (
            <View className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('subscription.b2b.plan', 'Plan')}
              </Text>
              <Text className="text-gray-900 dark:text-white">
                {b2bInfo.plan}
              </Text>
            </View>
          )}

          {b2bInfo?.role && (
            <View className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {t('subscription.b2b.role', 'Role')}
              </Text>
              <Text className="text-gray-900 dark:text-white">
                {b2bInfo.role}
              </Text>
            </View>
          )}

          <Text className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {t('subscription.b2b.contact_admin', 'For billing questions, please contact your organization administrator.')}
          </Text>
        </View>
      </View>
    </View>
  );
};