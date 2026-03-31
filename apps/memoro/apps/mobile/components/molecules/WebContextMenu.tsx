import React, { useEffect, useRef } from 'react';
import { View, Pressable, Platform } from 'react-native';
import ReactDOM from 'react-dom';
import { useTheme } from '~/features/theme/ThemeProvider';
import Text from '~/components/atoms/Text';
import Icon from '~/components/atoms/Icon';
import colors from '~/tailwind.config.js';

interface WebContextMenuItem {
	title: string;
	icon?: string;
	destructive?: boolean;
	onPress: () => void;
}

interface WebContextMenuProps {
	isVisible: boolean;
	position: { x: number; y: number };
	items: WebContextMenuItem[];
	onClose: () => void;
}

const WebContextMenu: React.FC<WebContextMenuProps> = ({ isVisible, position, items, onClose }) => {
	const { isDark, themeVariant } = useTheme();
	const menuRef = useRef<any>(null);

	// Get theme colors
	const backgroundColor = isDark
		? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.menuBackground || '#252525'
		: (colors as any).theme?.extend?.colors?.[themeVariant]?.menuBackground || '#FFFFFF';

	const textColor = isDark
		? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.text || '#FFFFFF'
		: (colors as any).theme?.extend?.colors?.[themeVariant]?.text || '#000000';

	const borderColor = isDark
		? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.border || '#424242'
		: (colors as any).theme?.extend?.colors?.[themeVariant]?.border || '#e6e6e6';

	const hoverColor = isDark
		? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.contentBackgroundHover ||
			'#333333'
		: (colors as any).theme?.extend?.colors?.[themeVariant]?.contentBackgroundHover || '#f5f5f5';

	// Handle click outside to close menu
	useEffect(() => {
		if (!isVisible) return;

		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target)) {
				onClose();
			}
		};

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				onClose();
			}
		};

		// Add event listeners
		document.addEventListener('mousedown', handleClickOutside);
		document.addEventListener('keydown', handleEscape);

		// Cleanup
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('keydown', handleEscape);
		};
	}, [isVisible, onClose]);

	if (!isVisible || Platform.OS !== 'web') return null;

	// Calculate menu position to keep it within viewport
	const menuStyle: React.CSSProperties = {
		position: 'fixed',
		top: position.y,
		left: position.x,
		zIndex: 9999,
		backgroundColor,
		borderWidth: 1,
		borderColor,
		borderRadius: 12,
		minWidth: 200,
		boxShadow: isDark ? '0 4px 24px rgba(0, 0, 0, 0.4)' : '0 4px 24px rgba(0, 0, 0, 0.1)',
		overflow: 'hidden',
	};

	// Adjust position if menu would go off screen
	if (typeof window !== 'undefined') {
		const menuWidth = 200;
		const menuHeight = items.length * 44 + 8; // Approximate height

		if (position.x + menuWidth > window.innerWidth) {
			menuStyle.left = position.x - menuWidth;
		}

		if (position.y + menuHeight > window.innerHeight) {
			menuStyle.top = position.y - menuHeight;
		}
	}

	const menuContent = (
		<div ref={menuRef} style={menuStyle}>
			<View style={{ padding: 8 }}>
				{items.map((item, index) => {
					const isDestructive = item.destructive;
					const itemTextColor = isDestructive ? '#FF3B30' : textColor;

					return (
						<Pressable
							key={index}
							onPress={() => {
								item.onPress();
								onClose();
							}}
							style={({ hovered }) => ({
								padding: 12,
								borderRadius: 8,
								backgroundColor: hovered ? hoverColor : 'transparent',
								flexDirection: 'row',
								alignItems: 'center',
								cursor: 'pointer',
							})}
						>
							{item.icon && (
								<View style={{ marginRight: 12 }}>
									<Icon name={item.icon} size={20} color={itemTextColor} />
								</View>
							)}
							<Text
								style={{
									color: itemTextColor,
									fontSize: 14,
									fontWeight: '500',
								}}
							>
								{item.title}
							</Text>
						</Pressable>
					);
				})}
			</View>
		</div>
	);

	// Use portal to render menu at document root
	if (typeof document !== 'undefined') {
		return ReactDOM.createPortal(menuContent, document.body);
	}

	return menuContent;
};

export default WebContextMenu;
