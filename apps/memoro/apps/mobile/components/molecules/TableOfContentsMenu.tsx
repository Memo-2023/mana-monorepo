import React, { useMemo } from 'react';
import { View } from 'react-native';
import Icon from '~/components/atoms/Icon';
import CustomMenu from '~/components/atoms/CustomMenu';
import { useTheme } from '~/features/theme/ThemeProvider';

interface TableOfContentsItem {
	id: string;
	title: string;
	icon: string;
	onPress: () => void;
}

interface TableOfContentsMenuProps {
	items: TableOfContentsItem[];
}

const MAX_MENU_ITEMS = 50;

const TableOfContentsMenu: React.FC<TableOfContentsMenuProps> = ({ items }) => {
	const { isDark } = useTheme();
	const iconColor = isDark ? '#FFFFFF' : '#000000';

	const sortedItems = useMemo(() => {
		const order = {
			'document-outline': 0,
			'play-outline': 1,
			'document-text-outline': 2,
			'reader-outline': 2,
			'text-outline': 3,
		};
		const limitedItems = items.slice(0, MAX_MENU_ITEMS);
		return [...limitedItems].sort((a, b) => {
			return (
				(order[a.icon as keyof typeof order] ?? 999) - (order[b.icon as keyof typeof order] ?? 999)
			);
		});
	}, [items]);

	const menuItems = useMemo(() => {
		return sortedItems.map((item) => ({
			key: item.id,
			title: item.title,
			iconName: item.icon,
			onSelect: item.onPress,
		}));
	}, [sortedItems]);

	return (
		<CustomMenu items={menuItems}>
			<View
				style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
			>
				<Icon name="reader-outline" size={24} color={iconColor} />
			</View>
		</CustomMenu>
	);
};

export default TableOfContentsMenu;
