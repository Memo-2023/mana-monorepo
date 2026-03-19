import { Ionicons } from '@expo/vector-icons';
import { Pressable, View, Text } from 'react-native';

import { useTheme } from '~/utils/themeContext';

interface ListItemProps {
	title: string;
	subtitle?: string;
	trailing?: string;
	left?: React.ReactNode;
	onPress?: () => void;
	onLongPress?: () => void;
	showChevron?: boolean;
}

export function ListItem({
	title,
	subtitle,
	trailing,
	left,
	onPress,
	onLongPress,
	showChevron,
}: ListItemProps) {
	const { colors } = useTheme();

	return (
		<Pressable
			onPress={onPress}
			onLongPress={onLongPress}
			style={({ pressed }) => ({
				flexDirection: 'row',
				alignItems: 'center',
				paddingVertical: 10,
				paddingHorizontal: 16,
				backgroundColor: pressed ? colors.backgroundTertiary : 'transparent',
			})}
		>
			{left && <View style={{ marginRight: 12 }}>{left}</View>}
			<View style={{ flex: 1, minWidth: 0 }}>
				<Text style={{ fontSize: 16, color: colors.text }} numberOfLines={1}>
					{title}
				</Text>
				{subtitle && (
					<Text
						style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}
						numberOfLines={1}
					>
						{subtitle}
					</Text>
				)}
			</View>
			{trailing && (
				<Text style={{ fontSize: 13, color: colors.textTertiary, marginLeft: 8 }}>{trailing}</Text>
			)}
			{showChevron && (
				<Ionicons
					name="chevron-forward"
					size={18}
					color={colors.textTertiary}
					style={{ marginLeft: 4 }}
				/>
			)}
		</Pressable>
	);
}
