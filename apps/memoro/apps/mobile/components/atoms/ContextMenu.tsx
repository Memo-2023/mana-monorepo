import React, { useRef, useState, useCallback } from 'react';
import { View, StyleSheet, Modal, Pressable, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useMenuColors } from './menu/useMenuColors';
import { useMenuPosition } from './menu/useMenuPosition';
import { menuContainerBase } from './menu/menuStyles';
import MenuItemList from './menu/MenuItemList';
import type { MenuItem } from './menu/MenuTypes';

// Re-export for backwards compatibility
export type { MenuItem as ContextMenuItem } from './menu/MenuTypes';

interface ContextMenuProps {
	items: MenuItem[];
	children: React.ReactNode;
	/** Deaktiviert das Context Menu (z.B. im Selection-Mode) */
	disabled?: boolean;
	/** Long-press Verzögerung in ms (default: 500) */
	delayLongPress?: number;
	/** Callback wenn Menü geöffnet/geschlossen wird */
	onOpenChange?: (isOpen: boolean) => void;
	/** Normaler onPress Handler (wird durchgereicht) */
	onPress?: () => void;
	/** Style für den äußeren Container */
	style?: any;
}

/**
 * iOS-style Context Menu für Long-Press auf Cards/Items.
 *
 * Zeigt das gedrückte Element hervorgehoben auf einem abgedunkelten
 * Hintergrund mit Menü-Optionen darunter (oder darüber).
 */
const ContextMenu: React.FC<ContextMenuProps> = ({
	items,
	children,
	disabled = false,
	delayLongPress = 500,
	onOpenChange,
	onPress,
	style,
}) => {
	const colors = useMenuColors();
	const { calculate } = useMenuPosition({
		items,
		menuWidth: 'dynamic',
		padding: 16,
		itemHeight: 48,
		align: 'center',
	});

	const [visible, setVisible] = useState(false);
	const [layout, setLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
	const [menuPos, setMenuPos] = useState({ menuX: 0, menuY: 0, menuWidth: 220, showAbove: false });
	const triggerRef = useRef<View>(null);

	// Animations
	const overlayOpacity = useRef(new Animated.Value(0)).current;
	const elementScale = useRef(new Animated.Value(1)).current;
	const menuOpacity = useRef(new Animated.Value(0)).current;
	const menuTranslateY = useRef(new Animated.Value(15)).current;

	const triggerHaptic = useCallback(async () => {
		try {
			await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
		} catch (error) {
			console.debug('Haptic feedback error:', error);
		}
	}, []);

	const openMenu = useCallback(() => {
		if (disabled) return;

		triggerHaptic();

		if (triggerRef.current) {
			triggerRef.current.measure((_x, _y, width, height, pageX, pageY) => {
				setLayout({ x: pageX, y: pageY, width, height });
				const pos = calculate(pageX, pageY, width, height);
				setMenuPos(pos);
				setVisible(true);
				onOpenChange?.(true);

				// Reset animation values
				overlayOpacity.setValue(0);
				elementScale.setValue(1);
				menuOpacity.setValue(0);
				menuTranslateY.setValue(15);

				// Animate open
				Animated.parallel([
					Animated.timing(overlayOpacity, {
						toValue: 1,
						duration: 200,
						useNativeDriver: true,
					}),
					Animated.spring(elementScale, {
						toValue: 1,
						friction: 8,
						tension: 100,
						useNativeDriver: true,
					}),
					Animated.timing(menuOpacity, {
						toValue: 1,
						duration: 200,
						delay: 80,
						useNativeDriver: true,
					}),
					Animated.timing(menuTranslateY, {
						toValue: 0,
						duration: 200,
						delay: 80,
						useNativeDriver: true,
					}),
				]).start();
			});
		}
	}, [
		disabled,
		triggerHaptic,
		onOpenChange,
		calculate,
		overlayOpacity,
		elementScale,
		menuOpacity,
		menuTranslateY,
	]);

	const closeMenu = useCallback(
		(callback?: () => void) => {
			Animated.parallel([
				Animated.timing(menuOpacity, {
					toValue: 0,
					duration: 150,
					useNativeDriver: true,
				}),
				Animated.timing(menuTranslateY, {
					toValue: 10,
					duration: 150,
					useNativeDriver: true,
				}),
				Animated.timing(elementScale, {
					toValue: 1,
					duration: 150,
					useNativeDriver: true,
				}),
				Animated.timing(overlayOpacity, {
					toValue: 0,
					duration: 180,
					delay: 50,
					useNativeDriver: true,
				}),
			]).start(() => {
				setVisible(false);
				onOpenChange?.(false);
				if (callback) {
					setTimeout(callback, 50);
				}
			});
		},
		[onOpenChange, overlayOpacity, elementScale, menuOpacity, menuTranslateY]
	);

	const handleItemPress = useCallback(
		(item: MenuItem) => {
			closeMenu(() => {
				item.onSelect?.();
			});
		},
		[closeMenu]
	);

	const handleOverlayPress = useCallback(() => {
		closeMenu();
	}, [closeMenu]);

	return (
		<>
			<Pressable
				ref={triggerRef}
				style={style}
				onPress={onPress}
				onLongPress={openMenu}
				delayLongPress={delayLongPress}
			>
				{children}
			</Pressable>

			<Modal
				transparent
				visible={visible}
				onRequestClose={handleOverlayPress}
				animationType="none"
				statusBarTranslucent
			>
				{/* Abgedunkelter Hintergrund */}
				<Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
					<Pressable style={StyleSheet.absoluteFill} onPress={handleOverlayPress} />
				</Animated.View>

				{/* Hervorgehobenes Element (Clone) — style ohne Margins */}
				<Animated.View
					style={[
						styles.highlightedElement,
						style,
						{
							position: 'absolute',
							top: layout.y,
							left: layout.x,
							width: layout.width,
							height: layout.height,
							margin: 0,
							marginLeft: 0,
							marginRight: 0,
							marginTop: 0,
							marginBottom: 0,
							marginHorizontal: 0,
							marginVertical: 0,
							transform: [{ scale: elementScale }],
						},
					]}
					pointerEvents="none"
				>
					{children}
				</Animated.View>

				{/* Menü-Optionen */}
				<Animated.View
					style={[
						styles.menuContainer,
						{
							top: menuPos.menuY,
							left: menuPos.menuX,
							width: menuPos.menuWidth,
							backgroundColor: colors.menuBg,
							borderColor: colors.borderColor,
							opacity: menuOpacity,
							transform: [{ translateY: menuTranslateY }],
						},
					]}
				>
					<MenuItemList
						items={items}
						onItemPress={handleItemPress}
						variant="context"
						colors={colors}
					/>
				</Animated.View>
			</Modal>
		</>
	);
};

const styles = StyleSheet.create({
	overlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0, 0, 0, 0.45)',
	},
	highlightedElement: {
		position: 'absolute',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 12 },
		shadowOpacity: 0.3,
		shadowRadius: 20,
		elevation: 16,
		zIndex: 10,
	},
	menuContainer: {
		...menuContainerBase,
		zIndex: 20,
	},
});

export default ContextMenu;
