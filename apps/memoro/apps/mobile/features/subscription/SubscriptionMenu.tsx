import React, { useMemo } from 'react';
import { View } from 'react-native';
import Icon from '~/components/atoms/Icon';
import CustomMenu from '~/components/atoms/CustomMenu';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { useAuth } from '~/features/auth';
import { openSupportEmail } from '~/features/support/utils/emailSupport';

interface SubscriptionMenuProps {
	onRestorePurchases: () => void;
}

const SubscriptionMenu: React.FC<SubscriptionMenuProps> = ({ onRestorePurchases }) => {
	const { isDark } = useTheme();
	const { t } = useTranslation();
	const { user } = useAuth();

	const iconColor = '#AEAEB2';

	const menuItems = useMemo(
		() => [
			{
				key: 'restore',
				title: t('subscription.restore_purchases', 'Restore Purchases'),
				iconName: 'refresh',
				onSelect: onRestorePurchases,
			},
			{
				key: 'support',
				title: t('subscription.contact_support', 'Contact Support'),
				iconName: 'mail-outline',
				onSelect: () => openSupportEmail({ userId: user?.id, t }),
			},
		],
		[t, onRestorePurchases, user?.id]
	);

	return (
		<CustomMenu items={menuItems}>
			<View style={{ padding: 12 }}>
				<Icon name="ellipsis-vertical" size={24} color={iconColor} />
			</View>
		</CustomMenu>
	);
};

export default SubscriptionMenu;
