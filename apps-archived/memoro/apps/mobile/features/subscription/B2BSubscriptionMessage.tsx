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
		<View className="flex-1 bg-gray-50 p-6 dark:bg-gray-900" style={{ paddingTop: 0 }}>
			<View
				className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800"
				style={{ marginTop: 0 }}
			>
				{/* Header */}
				<View className="mb-6 items-center">
					<View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
						<Text className="text-2xl">🏢</Text>
					</View>
					<Text className="text-center text-xl font-bold text-gray-900 dark:text-white">
						{t('subscription.b2b.title', 'Enterprise Account')}
					</Text>
				</View>

				{/* Content */}
				<View className="space-y-4">
					<Text className="text-center text-gray-600 dark:text-gray-300">
						{t('subscription.b2b.message', 'You have an enterprise account with managed billing.')}
					</Text>

					{b2bInfo?.organizationId && (
						<View className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
							<Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
								{t('subscription.b2b.organization', 'Organization')}
							</Text>
							<Text className="text-gray-900 dark:text-white">{b2bInfo.organizationId}</Text>
						</View>
					)}

					{b2bInfo?.plan && (
						<View className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
							<Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
								{t('subscription.b2b.plan', 'Plan')}
							</Text>
							<Text className="text-gray-900 dark:text-white">{b2bInfo.plan}</Text>
						</View>
					)}

					{b2bInfo?.role && (
						<View className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
							<Text className="text-sm font-semibold text-gray-700 dark:text-gray-300">
								{t('subscription.b2b.role', 'Role')}
							</Text>
							<Text className="text-gray-900 dark:text-white">{b2bInfo.role}</Text>
						</View>
					)}

					<Text className="text-center text-sm text-gray-500 dark:text-gray-400">
						{t(
							'subscription.b2b.contact_admin',
							'For billing questions, please contact your organization administrator.'
						)}
					</Text>
				</View>
			</View>
		</View>
	);
};
