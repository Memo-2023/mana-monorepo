import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from '~/components/atoms/Icon';
import Text from '~/components/atoms/Text';
import type { MenuItem } from './MenuTypes';

const VARIANT_CONFIG = {
	context: {
		iconSize: 22,
		fontSize: 17,
		iconContainerWidth: 34,
		dividerMarginLeft: 50,
		dividerHeight: StyleSheet.hairlineWidth,
		maxHeight: 350,
	},
	dropdown: {
		iconSize: 24,
		fontSize: 18,
		iconContainerWidth: 36,
		dividerMarginLeft: 0,
		dividerHeight: 3,
		maxHeight: 450,
	},
} as const;

type MenuVariant = keyof typeof VARIANT_CONFIG;

interface MenuItemListProps {
	items: MenuItem[];
	onItemPress: (item: MenuItem) => void;
	variant: MenuVariant;
	colors: {
		textColor: string;
		separatorColor: string;
		separatorBg: string;
	};
}

const MenuItemList: React.FC<MenuItemListProps> = ({ items, onItemPress, variant, colors }) => {
	const config = VARIANT_CONFIG[variant];

	return (
		<ScrollView style={{ maxHeight: config.maxHeight }} bounces={false}>
			{items.map((item, index) => {
				if (item.separator) {
					return (
						<View
							key={item.key}
							style={[
								styles.separator,
								{
									backgroundColor: colors.separatorBg,
									borderTopColor: colors.separatorColor,
									borderBottomColor: colors.separatorColor,
								},
							]}
						/>
					);
				}

				const itemColor = item.destructive ? '#FF3B30' : colors.textColor;
				const nextItem = items[index + 1];
				const showDivider = index < items.length - 1 && !(nextItem && nextItem.separator);

				return (
					<View key={item.key}>
						<TouchableOpacity
							onPress={() => onItemPress(item)}
							style={styles.menuItem}
							activeOpacity={0.6}
						>
							{item.iconName && (
								<View style={[styles.iconContainer, { width: config.iconContainerWidth }]}>
									<Icon name={item.iconName} size={config.iconSize} color={itemColor} />
								</View>
							)}
							<Text style={[styles.menuItemText, { color: itemColor, fontSize: config.fontSize }]}>
								{item.title}
							</Text>
						</TouchableOpacity>
						{showDivider && (
							<View
								style={[
									styles.divider,
									{
										backgroundColor: colors.separatorColor,
										marginLeft: config.dividerMarginLeft,
										height: config.dividerHeight,
									},
								]}
							/>
						)}
					</View>
				);
			})}
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	menuItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 13,
		paddingHorizontal: 16,
	},
	iconContainer: {
		alignItems: 'center',
	},
	menuItemText: {
		fontWeight: '500',
		flex: 1,
	},
	divider: {
		marginRight: 16,
	},
	separator: {
		height: 9,
		marginHorizontal: 0,
		borderTopWidth: 1,
		borderBottomWidth: 1,
	},
});

export default MenuItemList;
