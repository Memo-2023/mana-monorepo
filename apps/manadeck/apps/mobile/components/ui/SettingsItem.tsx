import React from 'react';
import { View, Pressable, ViewStyle } from 'react-native';
import { Text } from './Text';
import { Icon } from './Icon';
import { useThemeColors } from '~/utils/themeUtils';

interface SettingsItemProps {
	title: string;
	description?: string;
	icon?: string;
	onPress?: () => void;
	rightElement?: React.ReactNode;
	isLast?: boolean;
}

export const SettingsItem: React.FC<SettingsItemProps> = ({
	title,
	description,
	icon,
	onPress,
	rightElement,
	isLast = false,
}) => {
	const colors = useThemeColors();

	const containerStyle: ViewStyle = {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: isLast ? 0 : 1,
		borderBottomColor: colors.border,
	};

	const renderContent = () => (
		<View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
			{icon && (
				<View
					style={{
						marginRight: 12,
						height: 40,
						width: 40,
						alignItems: 'center',
						justifyContent: 'center',
						borderRadius: 20,
						backgroundColor: colors.muted,
					}}
				>
					<Icon name={icon} size={20} color={colors.primary} library="Ionicons" />
				</View>
			)}
			<View style={{ flex: 1, justifyContent: 'center' }}>
				<Text style={{ fontSize: 16, fontWeight: '500', color: colors.foreground }}>{title}</Text>
				{description && (
					<Text style={{ marginTop: 2, fontSize: 14, color: colors.mutedForeground }}>
						{description}
					</Text>
				)}
			</View>
			<View style={{ marginLeft: 12 }}>
				{rightElement || (
					<Icon
						name="chevron-forward-outline"
						size={20}
						color={colors.mutedForeground}
						library="Ionicons"
					/>
				)}
			</View>
		</View>
	);

	if (onPress) {
		return (
			<Pressable
				onPress={onPress}
				style={({ pressed }) => ({
					...containerStyle,
					opacity: pressed ? 0.7 : 1,
				})}
			>
				{renderContent()}
			</Pressable>
		);
	}

	return <View style={containerStyle}>{renderContent()}</View>;
};
