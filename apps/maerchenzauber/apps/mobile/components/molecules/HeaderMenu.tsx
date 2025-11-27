import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from '../atoms/Text';
import Icon from '../atoms/Icon';
import ManaIcon from '../icons/ManaIcon';

interface HeaderMenuProps {
	onSettingsPress: () => void;
	onArchivePress: () => void;
	onHelpPress: () => void;
	onManaPress: () => void;
	onFeedbackPress: () => void;
}

interface MenuItem {
	icon: keyof typeof Ionicons.glyphMap;
	label: string;
	onPress: () => void;
	color?: string;
	isCustomIcon?: boolean;
}

export default function HeaderMenu({
	onSettingsPress,
	onArchivePress,
	onHelpPress,
	onManaPress,
	onFeedbackPress,
}: HeaderMenuProps) {
	const [showMenu, setShowMenu] = useState(false);
	const insets = useSafeAreaInsets();

	const menuItems: MenuItem[] = [
		{
			icon: 'water-outline', // Wird ignoriert wenn isCustomIcon true ist
			label: 'Mana',
			onPress: () => {
				setShowMenu(false);
				setTimeout(onManaPress, 100);
			},
			color: '#4A9EFF',
			isCustomIcon: true,
		},
		{
			icon: 'archive-outline',
			label: 'Archiv',
			onPress: () => {
				setShowMenu(false);
				setTimeout(onArchivePress, 100);
			},
		},
		{
			icon: 'help-circle-outline',
			label: 'Hilfe',
			onPress: () => {
				setShowMenu(false);
				setTimeout(onHelpPress, 100);
			},
		},
		{
			icon: 'chatbubble-outline',
			label: 'Feedback & Wünsche',
			onPress: () => {
				setShowMenu(false);
				setTimeout(onFeedbackPress, 100);
			},
		},
		{
			icon: 'settings-outline',
			label: 'Einstellungen',
			onPress: () => {
				setShowMenu(false);
				setTimeout(onSettingsPress, 100);
			},
		},
	];

	return (
		<>
			<TouchableOpacity
				onPress={() => setShowMenu(true)}
				style={styles.triggerButton}
				hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
			>
				<View style={styles.iconContainer}>
					<Ionicons name="ellipsis-horizontal" size={24} color="#ffffff" />
				</View>
			</TouchableOpacity>

			<Modal
				visible={showMenu}
				transparent
				animationType="fade"
				onRequestClose={() => setShowMenu(false)}
			>
				<Pressable style={styles.backdrop} onPress={() => setShowMenu(false)}>
					<View style={[styles.menuContainer, { marginTop: insets.top + 64 }]}>
						{Platform.OS === 'ios' ? (
							<BlurView intensity={80} tint="dark" style={styles.menuContent}>
								{menuItems.map((item, index) => (
									<TouchableOpacity
										key={index}
										style={[styles.menuItem, index === menuItems.length - 1 && styles.lastMenuItem]}
										onPress={item.onPress}
									>
										{item.isCustomIcon ? (
											<ManaIcon size={22} color={item.color || '#FFFFFF'} />
										) : (
											<Ionicons name={item.icon} size={22} color={item.color || '#FFFFFF'} />
										)}
										<Text style={[styles.menuItemText, item.color && { color: item.color }]}>
											{item.label}
										</Text>
									</TouchableOpacity>
								))}
							</BlurView>
						) : (
							<View style={[styles.menuContent, styles.menuContentAndroid]}>
								{menuItems.map((item, index) => (
									<TouchableOpacity
										key={index}
										style={[styles.menuItem, index === menuItems.length - 1 && styles.lastMenuItem]}
										onPress={item.onPress}
									>
										{item.isCustomIcon ? (
											<ManaIcon size={22} color={item.color || '#FFFFFF'} />
										) : (
											<Ionicons name={item.icon} size={22} color={item.color || '#FFFFFF'} />
										)}
										<Text style={[styles.menuItemText, item.color && { color: item.color }]}>
											{item.label}
										</Text>
									</TouchableOpacity>
								))}
							</View>
						)}
					</View>
				</Pressable>
			</Modal>
		</>
	);
}

const styles = StyleSheet.create({
	triggerButton: {
		width: 40,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center',
	},
	iconContainer: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: 'rgba(255, 255, 255, 0.1)',
		alignItems: 'center',
		justifyContent: 'center',
	},
	backdrop: {
		flex: 1,
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
		justifyContent: 'flex-start',
		alignItems: 'flex-end',
	},
	menuContainer: {
		// marginTop wird jetzt dynamisch über useSafeAreaInsets gesetzt
		marginRight: 16,
		minWidth: 220,
		shadowColor: '#000',
		shadowOffset: {
			width: 0,
			height: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 8,
		elevation: 8,
	},
	menuContent: {
		borderRadius: 16,
		overflow: 'hidden',
	},
	menuContentAndroid: {
		backgroundColor: 'rgba(28, 28, 28, 0.98)',
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.1)',
	},
	menuItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 14,
		paddingHorizontal: 16,
		gap: 12,
		borderBottomWidth: 1,
		borderBottomColor: 'rgba(255, 255, 255, 0.1)',
	},
	lastMenuItem: {
		borderBottomWidth: 0,
	},
	menuItemText: {
		fontSize: 16,
		fontWeight: '500',
		color: '#FFFFFF',
	},
});
