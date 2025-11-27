import React, { useMemo } from 'react';
import { Platform, View } from 'react-native';
import Icon from '~/components/atoms/Icon';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { useAuth } from '~/features/auth';
import { openSupportEmail } from '~/features/support/utils/emailSupport';

// @expo/ui ContextMenu - use appropriate platform import
import {
	ContextMenu as ContextMenuiOS,
	Button as ButtoniOS,
	Host as HostiOS,
} from '@expo/ui/swift-ui';
import {
	ContextMenu as ContextMenuAndroid,
	Button as ButtonAndroid,
} from '@expo/ui/jetpack-compose';

// Select the correct components based on platform
const ContextMenu = Platform.OS === 'ios' ? ContextMenuiOS : ContextMenuAndroid;
const ExpoButton = Platform.OS === 'ios' ? ButtoniOS : ButtonAndroid;
const Host = Platform.OS === 'ios' ? HostiOS : View;

interface SubscriptionMenuProps {
	onRestorePurchases: () => void;
}

/**
 * Subscription-Menü-Komponente
 *
 * Eine Dropdown-Menü-Komponente für die Abonnementseite, die verschiedene Aktionen anbietet.
 * Nutzt @expo/ui ContextMenu für native Menus auf iOS und Android.
 */
const SubscriptionMenu: React.FC<SubscriptionMenuProps> = ({ onRestorePurchases }) => {
	const { isDark } = useTheme();
	const { t } = useTranslation();
	const { user } = useAuth();

	const iconColor = '#AEAEB2';

	// Menu items
	const menuItems = useMemo(() => {
		return [
			{
				key: 'restore',
				title: t('subscription.restore_purchases', 'Restore Purchases'),
				systemIcon: 'arrow.clockwise',
				onSelect: onRestorePurchases,
			},
			{
				key: 'support',
				title: t('subscription.contact_support', 'Contact Support'),
				systemIcon: 'envelope',
				onSelect: () => openSupportEmail({ userId: user?.id, t }),
			},
		];
	}, [t, onRestorePurchases, user?.id]);

	return (
		<Host>
			<ContextMenu>
				<ContextMenu.Items>
					{menuItems.map((item) => (
						<ExpoButton
							key={item.key}
							{...(Platform.OS === 'ios' && { systemImage: item.systemIcon })}
							onPress={item.onSelect}
						>
							{item.title}
						</ExpoButton>
					))}
				</ContextMenu.Items>

				<ContextMenu.Trigger>
					<View style={{ padding: 12 }}>
						<Icon name="ellipsis-vertical" size={24} color={iconColor} />
					</View>
				</ContextMenu.Trigger>
			</ContextMenu>
		</Host>
	);
};

export default SubscriptionMenu;
