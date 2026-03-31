import React, { useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Modal, Pressable, Animated, ViewStyle, StyleProp } from 'react-native';
import { useMenuColors } from './menu/useMenuColors';
import { useMenuPosition } from './menu/useMenuPosition';
import { menuContainerBase } from './menu/menuStyles';
import MenuItemList from './menu/MenuItemList';
import type { MenuItem } from './menu/MenuTypes';

// Re-export for backwards compatibility
export type { MenuItem as CustomMenuItem } from './menu/MenuTypes';

interface CustomMenuProps {
	items: MenuItem[];
	children: React.ReactNode;
	/** 'tap' opens on tap (default), 'longpress' opens on long press */
	trigger?: 'tap' | 'longpress';
	/** Disable built-in rotation animation on the trigger */
	disableRotation?: boolean;
	/** Called when menu opens or closes */
	onOpenChange?: (isOpen: boolean) => void;
	/** Style applied to the trigger wrapper */
	style?: StyleProp<ViewStyle>;
}

/**
 * Einheitliches Custom Dropdown-Menu mit Phosphor Icons.
 * Einheitliches Dropdown-Menu mit konsistenten Icons auf allen Plattformen.
 */
const CustomMenu: React.FC<CustomMenuProps> = ({
	items,
	children,
	trigger = 'tap',
	disableRotation = false,
	style,
	onOpenChange,
}) => {
	const colors = useMenuColors();
	const { calculate } = useMenuPosition({
		items,
		menuWidth: 260,
		padding: 12,
		itemHeight: 44,
		align: 'right',
	});

	const [visible, setVisible] = useState(false);
	const [menuPos, setMenuPos] = useState({ menuX: 0, menuY: 0, menuWidth: 260, showAbove: false });
	const [triggerLayout, setTriggerLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
	const triggerRef = useRef<View>(null);
	const rotateAnim = useRef(new Animated.Value(0)).current;

	const rotateInterpolation = rotateAnim.interpolate({
		inputRange: [0, 1],
		outputRange: ['0deg', '90deg'],
	});

	const showMenu = useCallback(() => {
		if (triggerRef.current) {
			triggerRef.current.measure((_x, _y, width, height, pageX, pageY) => {
				const pos = calculate(pageX, pageY, width, height);
				setMenuPos(pos);
				setTriggerLayout({ x: pageX, y: pageY, width, height });
				setVisible(true);
				onOpenChange?.(true);

				Animated.timing(rotateAnim, {
					toValue: 1,
					duration: 200,
					useNativeDriver: true,
				}).start();
			});
		}
	}, [calculate, rotateAnim, onOpenChange]);

	const hideMenu = useCallback(() => {
		onOpenChange?.(false);
		Animated.timing(rotateAnim, {
			toValue: 0,
			duration: 200,
			useNativeDriver: true,
		}).start(() => {
			setVisible(false);
		});
	}, [rotateAnim, onOpenChange]);

	const handleItemPress = useCallback(
		(item: MenuItem) => {
			onOpenChange?.(false);
			Animated.timing(rotateAnim, {
				toValue: 0,
				duration: 200,
				useNativeDriver: true,
			}).start(() => {
				setVisible(false);
				if (item.onSelect) {
					setTimeout(() => item.onSelect!(), 100);
				}
			});
		},
		[rotateAnim, onOpenChange]
	);

	const triggerContent = disableRotation ? (
		<Pressable
			ref={triggerRef}
			style={style}
			onPress={trigger === 'tap' ? showMenu : undefined}
			onLongPress={trigger === 'longpress' ? showMenu : undefined}
		>
			{children}
		</Pressable>
	) : (
		<Animated.View style={[{ transform: [{ rotate: rotateInterpolation }] }, style]}>
			<Pressable
				ref={triggerRef}
				onPress={trigger === 'tap' ? showMenu : undefined}
				onLongPress={trigger === 'longpress' ? showMenu : undefined}
			>
				{children}
			</Pressable>
		</Animated.View>
	);

	const overlayTrigger = disableRotation ? (
		<View
			style={{
				position: 'absolute',
				top: triggerLayout.y,
				left: triggerLayout.x,
				width: triggerLayout.width,
				height: triggerLayout.height,
			}}
			pointerEvents="box-none"
		>
			{children}
		</View>
	) : (
		<Animated.View
			style={{
				position: 'absolute',
				top: triggerLayout.y,
				left: triggerLayout.x,
				width: triggerLayout.width,
				height: triggerLayout.height,
				transform: [{ rotate: rotateInterpolation }],
			}}
			pointerEvents="box-none"
		>
			{children}
		</Animated.View>
	);

	return (
		<>
			{triggerContent}

			<Modal transparent visible={visible} onRequestClose={hideMenu} animationType="fade">
				<Pressable style={styles.overlay} onPress={hideMenu}>
					{overlayTrigger}

					<View
						style={[
							styles.menuContainer,
							{
								top: menuPos.menuY,
								left: menuPos.menuX,
								backgroundColor: colors.menuBg,
								borderColor: colors.borderColor,
							},
						]}
					>
						<MenuItemList
							items={items}
							onItemPress={handleItemPress}
							variant="dropdown"
							colors={colors}
						/>
					</View>
				</Pressable>
			</Modal>
		</>
	);
};

const styles = StyleSheet.create({
	overlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.25)',
	},
	menuContainer: {
		...menuContainerBase,
		width: 260,
	},
});

export default CustomMenu;
