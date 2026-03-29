import React, { useState, useRef } from 'react';
import {
	Modal,
	View,
	Text,
	Pressable,
	Dimensions,
	Platform,
	StyleSheet,
	FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/hooks/useTheme';

interface ContextMenuAction {
	title: string;
	systemIcon?: string;
	icon?: keyof typeof Ionicons.glyphMap;
	destructive?: boolean;
	disabled?: boolean;
}

interface ContextMenuProps {
	actions: ContextMenuAction[];
	onPress: (index: number) => void;
	children: React.ReactElement;
}

export function ContextMenu({ actions, onPress, children }: ContextMenuProps) {
	const [visible, setVisible] = useState(false);
	const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
	const childRef = useRef<View>(null);
	const { colors } = useTheme();

	const handleLongPress = () => {
		childRef.current?.measure((x, y, width, height, pageX, pageY) => {
			const screenHeight = Dimensions.get('window').height;
			const menuHeight = actions.length * 50 + 20; // Approximate menu height

			// Position menu above or below the pressed item based on available space
			const posY = pageY + height + menuHeight > screenHeight ? pageY - menuHeight : pageY + height;

			setMenuPosition({ x: pageX, y: posY });
			setVisible(true);
		});
	};

	const handleActionPress = (index: number) => {
		setVisible(false);
		// Small delay to allow modal to close before action
		setTimeout(() => onPress(index), 100);
	};

	const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
		'doc.text': 'document-text-outline',
		'play.circle': 'play-circle-outline',
		'square.and.arrow.up': 'share-outline',
		tag: 'pricetag-outline',
		trash: 'trash-outline',
	};

	const renderAction = ({ item, index }: { item: ContextMenuAction; index: number }) => {
		const iconName = item.icon || (item.systemIcon ? iconMap[item.systemIcon] : undefined);
		const isDisabled = item.disabled;
		const isDestructive = item.destructive;

		return (
			<Pressable
				onPress={() => !isDisabled && handleActionPress(index)}
				disabled={isDisabled}
				className={`flex-row items-center px-4 py-3 ${
					index < actions.length - 1 ? `border-b ${colors.border}` : ''
				}`}
				style={({ pressed }) => ({
					backgroundColor: pressed && !isDisabled ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
					opacity: isDisabled ? 0.5 : 1,
				})}
			>
				{iconName && (
					<Ionicons
						name={iconName}
						size={20}
						color={
							isDestructive ? '#EF4444' : colors.text.includes('white') ? '#FFFFFF' : '#111827'
						}
						style={{ marginRight: 12 }}
					/>
				)}
				<Text className={`text-base ${isDestructive ? 'text-red-500' : colors.text}`}>
					{item.title}
				</Text>
			</Pressable>
		);
	};

	return (
		<>
			<View ref={childRef} collapsable={false}>
				{React.cloneElement(children, {
					onLongPress: handleLongPress,
					delayLongPress: 500,
				} as any)}
			</View>

			<Modal
				visible={visible}
				transparent
				animationType="fade"
				onRequestClose={() => setVisible(false)}
			>
				<Pressable style={StyleSheet.absoluteFillObject} onPress={() => setVisible(false)}>
					<View style={[styles.backdrop, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]} />

					<View
						style={[
							styles.menu,
							{
								top: menuPosition.y,
								left: 20,
								right: 20,
								maxWidth: 300,
								alignSelf: 'center',
								backgroundColor: colors.text.includes('white') ? '#1f2937' : '#ffffff',
							},
						]}
						className={`rounded-lg shadow-lg ${colors.surface}`}
					>
						<FlatList
							data={actions}
							renderItem={renderAction}
							keyExtractor={(_, index) => index.toString()}
							scrollEnabled={false}
						/>
					</View>
				</Pressable>
			</Modal>
		</>
	);
}

const styles = StyleSheet.create({
	backdrop: {
		...StyleSheet.absoluteFillObject,
	},
	menu: {
		position: 'absolute',
		borderRadius: 12,
		overflow: 'hidden',
		...Platform.select({
			ios: {
				// @ts-ignore - React Native Web supports boxShadow
				boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.25)',
			},
			android: {
				elevation: 8,
			},
		}),
	},
});
