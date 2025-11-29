import React from 'react';
import {
	Platform,
	ActionSheetIOS,
	Modal,
	View,
	Text,
	Pressable,
	StyleSheet,
	FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/hooks/useTheme';

interface ActionMenuOption {
	title: string;
	systemIcon?: string;
	icon?: keyof typeof Ionicons.glyphMap;
	destructive?: boolean;
	disabled?: boolean;
}

interface ActionMenuProps {
	options: ActionMenuOption[];
	onSelect: (index: number) => void;
	children: React.ReactElement;
	title?: string;
	message?: string;
}

export function ActionMenu({ options, onSelect, children, title, message }: ActionMenuProps) {
	const [visible, setVisible] = React.useState(false);
	const { colors } = useTheme();

	const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
		'doc.text': 'document-text-outline',
		'play.circle': 'play-circle-outline',
		'square.and.arrow.up': 'share-outline',
		tag: 'pricetag-outline',
		trash: 'trash-outline',
	};

	const showActionSheet = () => {
		if (Platform.OS === 'ios') {
			const optionTitles = options.map((opt) => opt.title);
			const destructiveButtonIndex = options.findIndex((opt) => opt.destructive);
			const disabledButtonIndices = options
				.map((opt, idx) => (opt.disabled ? idx : -1))
				.filter((idx) => idx !== -1);

			ActionSheetIOS.showActionSheetWithOptions(
				{
					options: [...optionTitles, 'Abbrechen'],
					cancelButtonIndex: optionTitles.length,
					destructiveButtonIndex: destructiveButtonIndex >= 0 ? destructiveButtonIndex : undefined,
					disabledButtonIndices,
					title,
					message,
				},
				(buttonIndex) => {
					if (buttonIndex !== optionTitles.length) {
						onSelect(buttonIndex);
					}
				}
			);
		} else {
			setVisible(true);
		}
	};

	const handleSelect = (index: number) => {
		setVisible(false);
		setTimeout(() => onSelect(index), 100);
	};

	const renderOption = ({ item, index }: { item: ActionMenuOption; index: number }) => {
		const iconName = item.icon || (item.systemIcon ? iconMap[item.systemIcon] : undefined);
		const isDisabled = item.disabled;
		const isDestructive = item.destructive;

		return (
			<Pressable
				onPress={() => !isDisabled && handleSelect(index)}
				disabled={isDisabled}
				className={`flex-row items-center px-4 py-4`}
				style={({ pressed }) => ({
					backgroundColor: pressed && !isDisabled ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
					opacity: isDisabled ? 0.5 : 1,
				})}
			>
				{iconName && (
					<Ionicons
						name={iconName}
						size={22}
						color={
							isDestructive ? '#EF4444' : colors.text.includes('white') ? '#FFFFFF' : '#111827'
						}
						style={{ marginRight: 16 }}
					/>
				)}
				<Text className={`text-lg ${isDestructive ? 'text-red-500' : colors.text}`}>
					{item.title}
				</Text>
			</Pressable>
		);
	};

	return (
		<>
			{React.cloneElement(children, {
				onLongPress: showActionSheet,
				delayLongPress: 500,
			} as any)}

			{Platform.OS !== 'ios' && (
				<Modal
					visible={visible}
					transparent
					animationType="slide"
					onRequestClose={() => setVisible(false)}
				>
					<Pressable style={StyleSheet.absoluteFillObject} onPress={() => setVisible(false)}>
						<View style={styles.backdrop} />

						<View style={styles.container}>
							<View className={`rounded-t-2xl ${colors.surface}`} style={styles.menu}>
								{(title || message) && (
									<View className={`border-b px-4 py-3 ${colors.border}`}>
										{title && (
											<Text className={`text-center font-semibold ${colors.text}`}>{title}</Text>
										)}
										{message && (
											<Text className={`mt-1 text-center text-sm ${colors.textSecondary}`}>
												{message}
											</Text>
										)}
									</View>
								)}

								<FlatList
									data={options}
									renderItem={renderOption}
									keyExtractor={(_, index) => index.toString()}
									scrollEnabled={false}
									ItemSeparatorComponent={() => <View className={`h-px ${colors.border}`} />}
								/>

								<View className={`border-t ${colors.border}`}>
									<Pressable
										onPress={() => setVisible(false)}
										className="py-4"
										style={({ pressed }) => ({
											backgroundColor: pressed ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
										})}
									>
										<Text className="text-center text-lg font-medium text-blue-600">Abbrechen</Text>
									</Pressable>
								</View>
							</View>
						</View>
					</Pressable>
				</Modal>
			)}
		</>
	);
}

const styles = StyleSheet.create({
	backdrop: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'rgba(0, 0, 0, 0.4)',
	},
	container: {
		flex: 1,
		justifyContent: 'flex-end',
	},
	menu: {
		maxHeight: '80%',
		...Platform.select({
			ios: {
				// @ts-ignore - React Native Web supports boxShadow
				boxShadow: '0px -2px 8px rgba(0, 0, 0, 0.1)',
			},
			android: {
				elevation: 16,
			},
		}),
	},
});
